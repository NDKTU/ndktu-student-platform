import pytest
from httpx import AsyncClient
import os

@pytest.mark.asyncio
async def test_quiz_upload_image(auth_client: AsyncClient):
    # Create a dummy image file
    file_content = b"fake image content"
    files = {"file": ("test_image.jpg", file_content, "image/jpeg")}
    
    response = await auth_client.post("/quiz/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "uploads/questions" in data["url"]
    
    # Verify file exists
    # The URL in response is like https://.../uploads/questions/filename.jpg
    # We need to extract filename and check 'uploads/questions/filename.jpg'
    
    filename = data["url"].split("/")[-1]
    file_path = f"uploads/questions/{filename}"
    
    assert os.path.exists(file_path)
    
    # Clean up
    if os.path.exists(file_path):
        os.remove(file_path)
