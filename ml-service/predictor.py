#!/usr/bin/env python3
"""Optional scikit-learn spending predictor.

Reads JSON from stdin: { "series": [{ "month": "2026-01", "income": 1, "expenses": 2 }] }
Writes JSON to stdout. The Node API calls this only when USE_PYTHON_ML=true.
"""
import json
import sys


def main():
    payload = json.load(sys.stdin)
    series = payload.get("series") or []
    if len(series) < 2:
        json.dump(
            {
                "enoughData": False,
                "message": "Not enough transaction history. Add more transactions to generate a prediction.",
            },
            sys.stdout,
        )
        return

    try:
        import numpy as np
        from sklearn.linear_model import LinearRegression
    except ImportError:
        json.dump({"enoughData": False, "message": "scikit-learn is not installed."}, sys.stdout)
        return

    x = np.arange(len(series)).reshape(-1, 1)
    expenses = np.array([float(p.get("expenses") or 0) for p in series])
    income = np.array([float(p.get("income") or 0) for p in series])
    exp_model = LinearRegression().fit(x, expenses)
    inc_model = LinearRegression().fit(x, income)
    nxt = np.array([[len(series)]])
    expected_expenses = max(0.0, float(exp_model.predict(nxt)[0]))
    expected_income = max(0.0, float(inc_model.predict(nxt)[0]))
    json.dump(
        {
            "enoughData": True,
            "method": "python_sklearn",
            "monthsUsed": len(series),
            "expectedMonthlyExpenses": round(expected_expenses),
            "expectedMonthlyIncome": round(expected_income),
            "expectedSavings": round(expected_income - expected_expenses),
        },
        sys.stdout,
    )


if __name__ == "__main__":
    main()
