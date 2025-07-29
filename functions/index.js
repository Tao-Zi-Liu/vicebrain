// In functions/index.js

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const {VertexAI} = require("@google-cloud/vertexai");

admin.initializeApp();
const db = admin.firestore();

const vertexAi = new VertexAI({
  project: "vicebrain-5e3f5",
  location: "us-central1",
});

const generativeModel = vertexAi.getGenerativeModel({
  model: "gemini-1.5-flash-preview-0514",
});

exports.runAiAction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const uid = request.auth.uid;
  // For tagging, we pass title and content directly instead of a shinningId
  const {shinningId, action, title, content} = request.data;
  const AI_ACTION_COST = 1;

  if (!action) {
    throw new HttpsError("invalid-argument", "Required 'action' is missing.");
  }

  // Transaction to deduct credits
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new HttpsError("not-found", "User not found.");
      const currentCredits = userDoc.data().credits || 0;
      if (currentCredits < AI_ACTION_COST) {
        throw new HttpsError("failed-precondition", "Insufficient credits.");
      }
      transaction.update(userRef, {credits: currentCredits - AI_ACTION_COST});
    });
  } catch (error) {
    logger.error("Credit deduction failed:", error);
    if (error.code === "failed-precondition") throw error;
    throw new HttpsError("internal", "Could not process credits.");
  }

  let shinningText = "";
  // If we have a shinningId, get its text. Otherwise, use title/content from request.
  if (shinningId) {
    const shinningRef = db.collection(`users/${uid}/shinnings`).doc(shinningId);
    const shinningDoc = await shinningRef.get();
    if (!shinningDoc.exists) throw new HttpsError("not-found", "Shinning not found.");
    const data = shinningDoc.data();
    shinningText = `Title: ${data.title}. Content: ${data.content}`;
  } else if (title) {
    shinningText = `Title: ${title}. Content: ${content || ""}`;
  } else {
    throw new HttpsError("invalid-argument", "Required content is missing.");
  }

  let promptText = "";
  let resultType = "";
  let isJsonResponse = false;

  switch (action) {
    case "getAIExpansion":
      promptText = `... Shinning: "${shinningText}"`;
      resultType = "expansion";
      break;
    case "findRelatedMaterials":
      promptText = `... Topic: "${shinningText}"`;
      resultType = "materials";
      isJsonResponse = true;
      break;
    case "recommendSimilarCases":
      promptText = `... Shinning: "${shinningText}"`;
      resultType = "cases";
      isJsonResponse = true;
      break;
    // --- NEW CASE FOR TAGGING ---
    case "suggestTags":
      promptText = `Analyze the following text and suggest up to 5 relevant tags. Return the tags as a JSON array of strings. Text: "${shinningText}"`;
      resultType = "tags";
      isJsonResponse = true;
      break;
    default:
      throw new HttpsError("invalid-argument", "Invalid AI action.");
  }

  // Call the AI using the Vertex AI Library
  try {
    const resp = await generativeModel.generateContent(promptText);
    const responseText = resp.response.candidates[0].content.parts[0].text;

    let parsedData;
    if (isJsonResponse) {
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (!jsonMatch) throw new Error("AI did not return a valid JSON array.");
      parsedData = JSON.parse(jsonMatch[0]);
    } else {
      parsedData = responseText;
    }

    // For actions that save data back to a shinning, do so here.
    if (shinningId) {
      const shinningRef = db.collection(`users/${uid}/shinnings`).doc(shinningId);
      const aiResultToAdd = {data: parsedData, generatedAt: admin.firestore.FieldValue.serverTimestamp()};
      await shinningRef.update({
        [`aiResults.${resultType}`]: admin.firestore.FieldValue.arrayUnion(aiResultToAdd),
      });
    }

    // Return the data to the client
    return {success: true, data: parsedData};
  } catch (error) {
    logger.error("Vertex AI call failed:", error);
    throw new HttpsError("internal", "Failed to get a response from the AI.");
  }
});
