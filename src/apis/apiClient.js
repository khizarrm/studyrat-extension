export async function predict({ url, text, image_count, video_count, gif_count, media_density_ratio }) {
  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url, 
        text,
        image_count,
        video_count,
        gif_count,
        media_density_ratio
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json()

  } catch (error) {
    return null;
  }
}

export async function handleFeedback(feedbackData) {
  const {
    text,
    image_count,
    video_count,
    gif_count,
    media_density_ratio,
    originalPrediction,
    isCorrect
  } = feedbackData;

  // Determine true label based on model’s prediction + user’s correction:
  let shouldBeProductive;
  
  if (originalPrediction === false && isCorrect === true) {
    shouldBeProductive = false;
  } else if (originalPrediction === false && isCorrect === false) {
    shouldBeProductive = true;
  } else if (originalPrediction === true && isCorrect === true) {
    shouldBeProductive = true;
  } else if (originalPrediction === true && isCorrect === false) {
    shouldBeProductive = false;
  } else {
    // Fallback, though logically one of the above should always match
    console.warn("handleFeedback: Unexpected combination of originalPrediction/isCorrect");
    shouldBeProductive = false;
  }

  // Build the full JSON payload exactly as Flask’s /feedback now expects:
  const payload = {
    text: text,
    is_productive: shouldBeProductive,
    image_count: image_count ?? 0,
    video_count: video_count ?? 0,
    gif_count: gif_count ?? 0,
    media_density_ratio: media_density_ratio ?? 0.0
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result

  } catch (error) {
    console.error("Error sending feedback:", error);
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Study Rat – Feedback Error',
        message: 'Failed to send feedback. Please try again later.'
      });
    }
  }
}