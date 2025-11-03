import jwt
import datetime
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from paperiq_ai.models import User


@api_view(['POST'])
def register(request):
    email = request.data.get("email")
    password = request.data.get("password")
    name = request.data.get("name")

    if User.objects(email=email):
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    hashed_password = make_password(password)
    user = User(email=email, password_hash=hashed_password, name=name).save()

    return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if not check_password(password, user.password_hash):
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    payload = {
        "user_id": str(user.user_id),
        "email": user.email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        "iat": datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    return Response({
        "access": token,
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "name": user.name
        }
    })


@api_view(['GET'])
def get_user(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"error": "Authorization header missing"}, status=status.HTTP_401_UNAUTHORIZED)

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = User.objects.get(user_id=payload["user_id"])
    except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
        return Response({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        "id": str(user.user_id),
        "email": user.email,
        "name": user.name
    })
