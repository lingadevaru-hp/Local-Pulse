export const isPlaceholderFirebaseConfig = () => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    return (
        !apiKey ||
        apiKey === 'your-api-key' ||
        apiKey === 'placeholder-api-key' ||
        apiKey.includes('placeholder')
    );
};
