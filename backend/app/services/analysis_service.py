import csv
import math
from pathlib import Path
from typing import Dict, Any, List, Optional
from collections import Counter
from app.schemas.analysis import DatasetProfileResponse, ColumnProfile
from app.core.exceptions import LumiException

def try_parse_num(val: str) -> Optional[float]:
    val = val.strip()
    if not val:
        return None
    try:
        return float(val)
    except ValueError:
        return None

class AnalysisService:
    @staticmethod
    def profile_csv(file_path: Path) -> DatasetProfileResponse:
        if not file_path.exists():
            raise LumiException(status_code=404, detail="Dataset file not found.")

        rows = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if not header:
                    raise LumiException(status_code=400, detail="CSV file is empty.")
                
                # Sample up to 5000 rows
                for i, row in enumerate(reader):
                    if i >= 5000:
                        break
                    if row:
                        rows.append(row)
        except Exception as e:
            raise LumiException(status_code=400, detail=f"Failed to read CSV dataset: {str(e)}")

        total_rows = len(rows)
        total_cols = len(header)
        duplicate_rows = total_rows - len(set(tuple(r) for r in rows))

        columns_profile = []
        for col_idx, col_name in enumerate(header):
            col_values = [r[col_idx] if col_idx < len(r) else "" for r in rows]
            non_empty = [v.strip() for v in col_values if v.strip()]
            null_count = total_rows - len(non_empty)
            null_pct = round((null_count / max(1, total_rows)) * 100, 2)
            unique_count = len(set(non_empty))
            clean_samples = non_empty[:5]

            # Detect if numerical
            num_vals = []
            for v in non_empty:
                n = try_parse_num(v)
                if n is not None:
                    num_vals.append(n)

            is_numeric = len(num_vals) > 0 and (len(num_vals) / len(non_empty)) >= 0.8
            stats = {}

            if is_numeric and num_vals:
                num_vals.sort()
                n_count = len(num_vals)
                n_min = num_vals[0]
                n_max = num_vals[-1]
                n_mean = sum(num_vals) / n_count
                n_median = num_vals[n_count // 2]
                variance = sum((x - n_mean) ** 2 for x in num_vals) / max(1, n_count)
                n_std = math.sqrt(variance)

                stats = {
                    "min": round(n_min, 3),
                    "max": round(n_max, 3),
                    "mean": round(n_mean, 3),
                    "std": round(n_std, 3),
                    "median": round(n_median, 3)
                }
                dtype_str = "float64" if any("." in v for v in non_empty) else "int64"
            else:
                top_counts = Counter(non_empty).most_common(5)
                stats = {"top_categories": {k: v for k, v in top_counts}}
                dtype_str = "string"

            columns_profile.append(ColumnProfile(
                name=str(col_name).strip(),
                dtype=dtype_str,
                null_count=null_count,
                null_percentage=null_pct,
                unique_count=unique_count,
                sample_values=clean_samples,
                stats=stats
            ))

        # Build head preview records
        head_records = []
        for r in rows[:15]:
            record = {}
            for col_idx, col_name in enumerate(header):
                val = r[col_idx] if col_idx < len(r) else None
                record[str(col_name).strip()] = val
            head_records.append(record)

        return DatasetProfileResponse(
            filename=file_path.name,
            total_rows=total_rows,
            total_columns=total_cols,
            duplicate_rows=duplicate_rows,
            columns=columns_profile,
            head_rows=head_records
        )

    @staticmethod
    def execute_aggregation(
        file_path: Path,
        group_col: str,
        agg_col: str,
        agg_func: str = "mean"
    ) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            groups = {}
            for row in reader:
                g_val = row.get(group_col)
                a_val = row.get(agg_col)
                if g_val is not None and a_val is not None:
                    num = try_parse_num(a_val)
                    if num is not None:
                        groups.setdefault(g_val, []).append(num)

        results = []
        for g_val, nums in groups.items():
            if not nums:
                continue
            if agg_func == "sum":
                agg_res = sum(nums)
            elif agg_func == "count":
                agg_res = len(nums)
            elif agg_func == "min":
                agg_res = min(nums)
            elif agg_func == "max":
                agg_res = max(nums)
            else: # mean
                agg_res = sum(nums) / len(nums)

            results.append({
                group_col: g_val,
                f"{agg_col}_{agg_func}": round(agg_res, 3)
            })

        results.sort(key=lambda x: x[f"{agg_col}_{agg_func}"], reverse=True)
        return results[:20]

analysis_service = AnalysisService()
