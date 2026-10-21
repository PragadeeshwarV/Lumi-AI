import ast
import operator
import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# Supported operators for safe AST evaluation
_ALLOWED_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_ALLOWED_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "log10": math.log10,
    "exp": math.exp,
    "ceil": math.ceil,
    "floor": math.floor,
}

def safe_eval_math(expression: str) -> float:
    """Safely evaluates a basic math expression using AST parsing without eval/exec."""
    cleaned = expression.strip().replace("^", "**")
    
    def _eval(node):
        if isinstance(node, ast.Expression):
            return _eval(node.body)
        elif isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise ValueError(f"Constant '{node.value}' not allowed")
        elif isinstance(node, ast.BinOp):
            left = _eval(node.left)
            right = _eval(node.right)
            op = type(node.op)
            if op in _ALLOWED_OPERATORS:
                return _ALLOWED_OPERATORS[op](left, right)
            raise ValueError(f"Operator {op} not permitted")
        elif isinstance(node, ast.UnaryOp):
            operand = _eval(node.operand)
            op = type(node.op)
            if op in _ALLOWED_OPERATORS:
                return _ALLOWED_OPERATORS[op](operand)
            raise ValueError(f"Unary operator {op} not permitted")
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in _ALLOWED_FUNCTIONS:
                args = [_eval(arg) for arg in node.args]
                return _ALLOWED_FUNCTIONS[node.func.id](*args)
            raise ValueError(f"Function call not permitted: {ast.dump(node)}")
        else:
            raise ValueError(f"AST node type {type(node)} is not permitted")

    tree = ast.parse(cleaned, mode='eval')
    return _eval(tree)

class ToolService:
    @staticmethod
    def calculate(expression: str) -> Dict[str, Any]:
        try:
            result = safe_eval_math(expression)
            return {"success": True, "expression": expression, "result": result}
        except Exception as e:
            return {"success": False, "expression": expression, "error": str(e)}

    @staticmethod
    def get_current_time(timezone_name: str = "UTC") -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "success": True,
            "utc_iso": now.isoformat(),
            "formatted": now.strftime("%A, %B %d, %Y at %I:%M:%S %p UTC"),
            "timestamp": int(now.timestamp())
        }

    @staticmethod
    def analyze_text(text: str) -> Dict[str, Any]:
        words = text.split()
        word_count = len(words)
        char_count = len(text)
        char_no_spaces = len(text.replace(" ", ""))
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        sentence_count = max(1, len(sentences))
        avg_word_length = round(char_no_spaces / max(1, word_count), 2)
        reading_time_minutes = round(word_count / 200.0, 1) # ~200 WPM
        
        return {
            "word_count": word_count,
            "character_count": char_count,
            "sentence_count": sentence_count,
            "avg_word_length": avg_word_length,
            "estimated_reading_time_min": reading_time_minutes
        }

tool_service = ToolService()
