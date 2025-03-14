from youtube_transcript_api import YouTubeTranscriptApi

video_id = "Ks-_Mh1QhMc"  # Thay bằng video ID
transcript = YouTubeTranscriptApi.get_transcript(video_id)
text = " ".join([item["text"] for item in transcript])
print(text)
