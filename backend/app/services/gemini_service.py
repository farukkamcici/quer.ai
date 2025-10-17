import google.generativeai as genai
import json
from app.core.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')


def generate_sql_and_explanation(question: str, db_schema: str) -> tuple[str, str]:
    """
    Uses Gemini to generate a SQL query and a user friendly explanation
    based on a dynamic database schema.
    """
    prompt = f"""
    You are a data analysis expert. Your task is to write a single, syntactically correct SQL query based on the user's question and the database schema provided below. And write an explanation for the user regarding the query which you wrote.

    **Instructions and Constraints:**
    1.  You MUST use ONLY the tables and columns present in the schema below.
    2.  **Do not** invent any table or column names.
    3.  If the user's question cannot be answered using the given schema, you MUST respond with a JSON object where "sql_query" is "SELECT 'Cannot answer this question with the available data';" and "explanation" clearly states why.
    4.  Your final output must be a single, minified JSON object with two keys: "sql_query" and "explanation".

    ### Database Schema:
    {db_schema}

    ### User Question:
    {question}
    """

    try:
        print("Sending request to Gemini API with the new 'grounding' prompt...")
        response = model.generate_content(prompt)

        # Clean the response to ensure it's valid JSON
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        result = json.loads(cleaned_response)

        sql_query = result.get("sql_query", "SELECT 'Invalid SQL generated';")
        explanation = result.get("explanation", "No explanation provided.")

        print(f"Generated SQL: {sql_query}")
        return sql_query, explanation

    except (Exception, json.JSONDecodeError) as e:
        print(f"Error calling Gemini API or parsing JSON: {e}")
        return "SELECT 'API Error';", f"An error occurred: {str(e)}"