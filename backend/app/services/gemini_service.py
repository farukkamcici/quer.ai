import google.generativeai as genai
import json
from app.core.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')


def generate_intelligent_response(question: str, db_schema: str) -> tuple[str, str | None, str]:
    """
    Uses Gemini to analyze user intent and generate either a SQL query
    or a meta-data answer, along with an explanation.
    Returns a tuple: (response_type, sql_query, explanation)
    """
    prompt = f"""
    You are a data analysis expert. Your task is to analyze the user's question and the database schema to determine the user's **intent**.

    **Intent 1: Data Query (SQL)**
    If the user's question asks for specific data (e.g., "how many users", "list products", "what is the total sales"), your task is to generate a SQL query.

    **Intent 2: Meta-Data Question (Meta)**
    If the user's question is about the database structure itself (e.g., "what is this database about?", "what columns are in the 'orders' table?", "explain this schema"), your task is to provide a natural language answer.

    **Instructions and Constraints:**
    1.  You MUST use ONLY the tables and columns present in the schema for both intents.
    2.  If the question cannot be answered using the schema or it is irrelevant, you MUST respond with "error": "sql", "sql_query": "", and "explanation": "Cannot answer this question with the available data" clearly stating why.
    3.  Your final output must be a single, minified JSON object based on the detected intent.

    **Output Format based on Intent:**

    * **If Intent is SQL:**
        {{
            "response_type": "sql",
            "sql_query": "YOUR_SQL_QUERY_HERE",
            "explanation": "A user-friendly explanation of the SQL query."
        }}

    * **If Intent is Meta:**
        {{
            "response_type": "meta",
            "sql_query": null,
            "explanation": "Your natural language answer to the user's question about the schema."
        }}

    ### Database Schema:
    {db_schema}

    ### User Question:
    {question}
    """

    try:
        response = model.generate_content(prompt)

        # Clean the response to ensure it's valid JSON
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        result = json.loads(cleaned_response)

        response_type = result.get("response_type", "meta")  # Default to meta if type is missing
        sql_query = result.get("sql_query")  # This will be null for 'meta' type
        explanation = result.get("explanation", "No explanation provided.")

        return response_type, sql_query, explanation

    except (Exception, json.JSONDecodeError) as e:
        print(f"Error calling Gemini API or parsing JSON: {e}")
        error_message = f"An error occurred: {str(e)}"
        # Return a clear error response
        return "error", None, error_message