from auth import verify_token, SECRET_KEY, ALGORITHM
import traceback
import os
import jwt
from jose import jwt as jose_jwt

try:
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZSIsImV4cCI6MTc1MzAxMzYxM30.T4GcwmV_Yxr7HCVoVz__wwvPtz7g9ByTAbLQWscbnSI"
    
    print(f"Environment SECRET_KEY: {os.environ.get('SECRET_KEY')}")
    print(f"Module SECRET_KEY: {SECRET_KEY}")
    print(f"ALGORITHM: {ALGORITHM}")
    
    # Try with PyJWT
    try:
        payload_pyjwt = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"PyJWT payload: {payload_pyjwt}")
    except Exception as e:
        print(f"PyJWT error: {e}")
    
    # Try with python-jose
    try:
        payload_jose = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Jose JWT payload: {payload_jose}")
    except Exception as e:
        print(f"Jose JWT error: {e}")
    
    # Try our function
    payload = verify_token(token)
    print(f"verify_token result: {payload}")
    
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc() 