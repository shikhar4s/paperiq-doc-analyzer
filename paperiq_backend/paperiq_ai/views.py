from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
import os
import json
import datetime

# --- Import your models to interact with the database ---
from .models import User, DocumentData, Entity
from mongoengine.errors import DoesNotExist, ValidationError

# --- Your tool initializations ---
from paperiq_tools.Pipeline import DocumentPipeline
from paperiq_tools.InsightExtractor import InsightExtractor
from paperiq_tools.summarizer import GeminiSummarizer

pipeline = DocumentPipeline()
extractor = InsightExtractor()
summarizer = GeminiSummarizer()

# --- UNCHANGED: This view remains a simple utility for debugging ---
@csrf_exempt
@api_view(['POST'])
def ingest_document(request):
    """
    Extracts raw text from a document. Does not save to the database.
    Returns the FULL raw text.
    """
    file_path = None
    try:
        file = request.FILES.get("file")
        if not file:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        
        file_path = default_storage.save(file.name, file)
        abs_path = os.path.join(default_storage.location, file_path)
        raw_text = pipeline.ingest_document(abs_path)

        return JsonResponse({"message": "File ingested successfully", "text": raw_text})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    finally:
        if file_path and default_storage.exists(file_path):
            default_storage.delete(file_path)

# --- UNCHANGED: This view remains a simple utility for debugging ---
@csrf_exempt
@api_view(['POST'])
def preprocess_text(request):
    """
    Cleans a given piece of text. Does not save to the database.
    Returns the FULL cleaned text.
    """
    try:
        text = request.POST.get("text")
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        clean_text = pipeline.clean_text(text)
        return JsonResponse({"clean_text": clean_text})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# --- UPDATED: Returns full data and handles exceptions ---
@csrf_exempt
@api_view(['POST'])
def extract_insights(request):
    """
    Extracts entities and keywords from text. Does not save to the database.
    Returns the FULL list of entities and keywords.
    """
    try:
        text = request.POST.get("text")
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        insights = extractor.extract(text)
        return JsonResponse({
            "entities": insights.get("entities", []),
            "keywords": insights.get("keywords", [])
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# --- HEAVILY UPDATED: This is now the main endpoint for processing AND saving ---
@csrf_exempt
@api_view(['POST'])
def summarize_text(request):
    """
    Processes a document, generates a summary, extracts insights,
    and saves the Document and its Entities to the database, linked to a user.
    """
    file_path = None
    try:
        # 1. Get required data from the request
        file = request.FILES.get("file")
        if not file:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        
        # User ID is now required to link the document to an authenticated user
        user_id = request.POST.get("user_id")
        if not user_id:
            return JsonResponse({"error": "user_id is required for processing."}, status=400)
            
        # Optional metadata
        title = request.POST.get("title", file.name)
        source_url = request.POST.get("source_url", "")

        # 2. Authenticate the user
        try:
            uploader = User.objects.get(pk=user_id)
        except (DoesNotExist, ValidationError):
            return JsonResponse({"error": f"User with id '{user_id}' not found or invalid."}, status=404)

        # 3. Process the document through the pipeline
        file_path = default_storage.save(file.name, file)
        abs_path = os.path.join(default_storage.location, file_path)
        clean_text = pipeline.process_document(abs_path)

        # 4. Generate summary and extract insights
        summary = summarizer.summarize(clean_text)
        insights = extractor.extract(clean_text)

        # 5. Save data to the database
        # Create the main document record
        new_document = DocumentData(
            title=title,
            abstract=summary,
            source_url=source_url,
            ingestion_date=datetime.datetime.utcnow(),
            uploaded_by=uploader,  # Link to the authenticated user
        )
        new_document.save()

        # Create entity records and link them to the document
        entities_saved = []
        for entity_tuple in insights.get("entities", []):
            # The extractor returns a tuple: (text, label)
            entity_text, entity_type = entity_tuple
            new_entity = Entity(
                entity_text=entity_text,
                entity_type=entity_type,
                doc=new_document,  # This creates the relation between Entity and DocumentData
            )
            new_entity.save()
            entities_saved.append({"text": entity_text, "type": entity_type})

        # 6. Return a comprehensive success response
        return JsonResponse({
            "status": "success",
            "filename": file.name,
            "summary": summary,
            "doc_id": str(new_document.doc_id), # Add the new document ID
            "entities_saved_count": len(entities_saved),
        })

    except Exception as e:
        # Catch-all for any other unexpected errors
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
    
    finally:
        # 7. Always clean up the uploaded file
        if file_path and default_storage.exists(file_path):
            default_storage.delete(file_path)