import { GoogleGenerativeAI, Part } from "@google/generative-ai"; // Use import, correct type is Part

// Access your API key as an environment variable
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
}
const genAI = new GoogleGenerativeAI(apiKey);

// Define the expected structure of the JSON result from Gemini
export interface GeminiTransactionResult {
  merchant: string | null;
  amount: number | null; // Expecting a number directly from Gemini based on prompt
  date: string | null; // Expecting YYYY-MM-DD string
  category: string | null;
}

// --- Helper function to convert buffer to Gemini Part ---
// Add types for parameters and return value
function fileToGenerativePart(buffer: Buffer, mimeType: string): Part { // Use Part type
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// --- Main analysis function ---
// Add export keyword, parameter types, and return type annotation
export async function analyzeTransactionImage(imageBuffer: Buffer, mimeType: string): Promise<GeminiTransactionResult[]> {
  // For text-and-image input (multimodal), use the gemini-2.0-flash model
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use gemini-2.0-flash for multimodal

  const prompt = `
    Analyze the following transaction screenshot. Extract ALL transaction details visible.
    For each transaction, provide a JSON object with these fields:
    - merchant: The name of the merchant or vendor (string).
    - amount: The transaction amount as a number (float). Use negative for debits/purchases, positive for credits/income.
    - date: The date of the transaction in "YYYY-MM-DD" format (string). If the year isn't present, assume the current year.
    - category: Suggest ONE category from this list: Groceries, Dining, Transport, Utilities, Entertainment, Shopping, Income, Transfer, Rent/Mortgage, Fees, Other (string).

    If any field is unclear or missing for a transaction, use null for that field.
    Respond ONLY with a valid JSON array containing one object for each distinct transaction found in the image. Do not include any other text or markdown formatting. Example: [{"merchant": "Example Cafe", "amount": -12.50, "date": "2024-03-15", "category": "Dining"}, {"merchant": "Salary", "amount": 2000.00, "date": "2024-03-14", "category": "Income"}]
  `;

  const imagePart = fileToGenerativePart(imageBuffer, mimeType);

  try {
    // Corrected console log to reflect the actual model being used
    console.log("Sending image to Gemini (gemini-2.0-flash) for analysis...");
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini Raw Response Text:", text);

    // Attempt to parse the JSON response from Gemini
    let jsonData: GeminiTransactionResult[]; // Type the variable

    // Clean potential markdown formatting
    const cleanedText = text.replace(/^```json\s*|\s*```$/g, '').trim();

    try {
        jsonData = JSON.parse(cleanedText);
        // Basic validation: Check if it's an array
        if (!Array.isArray(jsonData)) {
            console.error("Gemini response was not a JSON array:", jsonData);
            throw new Error("Gemini response was not in the expected array format.");
        }
    } catch (parseError: any) {
        console.error("Failed to parse Gemini JSON response:", parseError);
        console.error("Cleaned Gemini Text:", cleanedText); // Log the text that failed parsing
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
    }


    console.log("Parsed Gemini JSON Data (Array):", jsonData);
    return jsonData; // Return the array

  } catch (error: any) { // Add type annotation
    console.error("Error analyzing image with Gemini:", error);
    // Improve error message detail
    throw new Error(`Failed to analyze transaction image with Gemini: ${error.message}`);
  }
}

// No need for module.exports when using export keyword above
