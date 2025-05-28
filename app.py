from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit
import google.generativeai as genai
import os
import time
import base64
import io
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'
import numpy as np
import cv2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini with your API key
gemini_api_key = "AIzaSyADBwv9TJxmcBu-V4ZvpLxpROkjsdzxDgo"
genai.configure(api_key=gemini_api_key)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()
socketio = SocketIO(app, cors_allowed_origins="*")

# More reliable model configuration
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('message')
def handle_message(msg):
    try:
        # Improved prompt engineering
        prompt = f"""You are ZenithIQ, a friendly AI tutor. Respond helpfully to:
        
        User: {msg}
        
        Guidelines:
        - Be concise but thorough
        - Use simple language
        - Suggest drawings when helpful
        - Provide 3 follow-up questions"""

        # More reliable response handling
        response = model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("Empty response from API")

        # Generate follow-ups
        follow_up = model.generate_content(
            f"Generate 3 very short follow-up questions for this response: {response.text}"
        )

        questions = [
            "Can you explain differently?",
            "Could you give an example?",
            "How is this useful?"
        ]
        
        if follow_up.text:
            questions = [q.strip() for q in follow_up.text.split('\n')[:3] if q.strip()]

        emit('response', {
            'response': response.text,
            'suggestedQuestions': questions
        })

    except Exception as e:
        print(f"API Error: {str(e)}")
        # More helpful error message
        emit('response', {
            'response': "I'm having trouble connecting to the knowledge base. Please try again in a moment.",
            'suggestedQuestions': [
                "Try asking differently",
                "Ask about another topic",
                "Check your internet connection"
            ]
        })

@socketio.on('generate_mindmap')
def handle_mindmap(data):
    try:
        prompt = f"""Create a mind map in Mermaid.js syntax for the following content.
        The mind map should have a central node representing the main topic, with several main branches extending directly from it.
        Each branch should have a concise label.

        Content: {data['content']}

        Guidelines:
        - Use graph LR (left-to-right) or graph TD (top-down) for direction.
        - Start with the central node, e.g., A[Main Topic].
        - Connect main branches directly to the central node, e.g., A --> B[Branch 1].
        - Use clear, concise labels for all nodes.
        - Include 3-5 main branches.
        - Use proper Mermaid.js syntax.
        - Add some basic styling if possible for better visualization.
        - Ensure the output is *only* the Mermaid syntax block.
        """

        response = model.generate_content(prompt)

        if response.text:
            print(f"Raw model output for mindmap:\n{response.text}") # Log raw output
            # Clean up the response to ensure valid Mermaid syntax
            mermaid_code = response.text.strip()
            # Attempt to extract the mermaid block if the model includes extra text
            if '```mermaid' in mermaid_code:
                mermaid_code = mermaid_code.split('```mermaid')[-1].split('```')[0].strip()
            elif '```' in mermaid_code:
                 mermaid_code = mermaid_code.split('```')[-1].split('```')[0].strip()

            if not mermaid_code.startswith('graph'):
                # As a fallback, try to force a simple structure if the model fails to follow instructions
                central_node_text = data['content'][:30] + '...' if len(data['content']) > 30 else data['content']
                mermaid_code = f'graph TD\nA[{central_node_text}]'
                print(f"Falling back to basic mindmap: {mermaid_code}") # Log fallback action

            print(f"Cleaned mermaid code:\n{mermaid_code}") # Log cleaned output
            emit('mindmap', {'mermaid': mermaid_code})
        else:
            raise ValueError("Empty response from API")

    except Exception as e:
        print(f"Mind map generation error: {str(e)}")
        emit('mindmap', {'mermaid': 'graph TD\nA[Error generating mind map]'})

@socketio.on('generate_notes')
def handle_notes(data):
    try:
        prompt = f"""Create comprehensive study notes for the following content.
        Format them in a clear, organized way with sections and bullet points.
        
        Content: {data['content']}
        
        Guidelines:
        - Use clear headings and subheadings
        - Include key points and definitions
        - Add examples where relevant
        - Use bullet points for better readability
        - Keep it concise but thorough"""

        response = model.generate_content(prompt)
        
        if response.text:
            emit('notes', {'notes': response.text})
        else:
            raise ValueError("Empty response from API")

    except Exception as e:
        print(f"Notes generation error: {str(e)}")
        emit('notes', {'notes': 'Error generating notes. Please try again.'})

@socketio.on('recognize_drawing')
def handle_recognition(data):
    try:
        # Decode base64 image
        image_data = data['imageData'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Preprocess image for better recognition
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        
        # Perform OCR
        text = pytesseract.image_to_string(thresh)
        
        # Clean up the recognized text
        text = text.strip()
        
        if text:
            emit('recognition_result', {'text': text})
        else:
            emit('recognition_result', {'text': None})
            
    except Exception as e:
        print(f"Recognition error: {str(e)}")
        emit('recognition_result', {'text': None})

def generate_ai_drawing(prompt):
    try:
        drawing = None
        if 'graph' in prompt.lower():
            drawing = {
                'points': [
                    {'x': 100, 'y': 300}, {'x': 500, 'y': 300},  # X-axis
                    {'x': 300, 'y': 100}, {'x': 300, 'y': 500},  # Y-axis
                    {'x': 350, 'y': 250}, {'x': 400, 'y': 200}   # Sample line
                ],
                'color': '#19c37d',
                'width': 2
            }
        elif 'diagram' in prompt.lower():
            drawing = {
                'points': [
                    {'x': 200, 'y': 200}, {'x': 400, 'y': 200},
                    {'x': 400, 'y': 400}, {'x': 200, 'y': 400},
                    {'x': 200, 'y': 200}  # Square
                ],
                'color': '#19c37d',
                'width': 2
            }
        
        if drawing:
            time.sleep(1)
            emit('ai_drawing', drawing, broadcast=True)
            drawing_strokes.append(drawing)
    except Exception as e:
        print(f"Drawing error: {str(e)}")

# [Rest of your existing code...]
        questions = []
        if follow_up.text:
            lines = [line.strip('-* ').strip() for line in follow_up.text.split('\n') if line.strip()]
            questions = [q for q in lines if q and len(q) < 60][:3]
        
        # Fallback questions
        if len(questions) < 3:
            questions = [
                "Can you explain that differently?",
                "Could you give an example?",
                "How is this applied in real life?"
            ]

        # Check for drawing prompts
        if any(keyword in ai_response.lower() for keyword in ['draw', 'diagram', 'graph', 'chart']):
            generate_ai_drawing(ai_response)

        emit('response', {
            'response': ai_response,
            'suggestedQuestions': questions
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        emit('response', {
            'response': "I encountered an error. Could you try asking differently?",
            'suggestedQuestions': [
                "Can you rephrase your question?",
                "Could we try a different topic?",
                "Would you like an example?"
            ]
        })

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=404)