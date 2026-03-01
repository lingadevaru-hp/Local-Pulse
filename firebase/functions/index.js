const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = getFirestore();

/**
 * Auto-approves event requests and moves them to the 'events' collection.
 */
exports.processEventRequest = onDocumentCreated("eventRequests/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;

    const data = snapshot.data();
    const requestId = event.params.requestId;

    // Placeholder Auto-Approval Logic
    // In a real system, you would check for keywords, organizer reputation, etc.
    const isApproved = true;

    try {
        if (isApproved) {
            // 1. Mark request as approved
            await snapshot.ref.update({
                status: 'approved',
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. Prepare event data (remove internal request fields)
            const eventData = {
                ...data,
                id: requestId, // Use the same ID for consistency
                status: 'approved',
                originalRequestId: requestId,
                publishedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            delete eventData.createdAt;

            // 3. Move to public events collection
            await db.collection("events").doc(requestId).set(eventData);
            console.log(`Successfully approved and published event: ${requestId}`);
        } else {
            await snapshot.ref.update({
                status: 'rejected',
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Rejected event request: ${requestId}`);
        }
    } catch (error) {
        console.error("Error processing event request:", error);
    }

    return null;
});
