from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MONGO_URI: str = "mongodb+srv://infozodex_db:infozodex_db@zodex.h0qhx59.mongodb.net/satkamatka?retryWrites=true&w=majority"
    MONGO_URI: str = "mongodb+srv://infozodex_db_user:absolutions@data.yycywiw.mongodb.net/ankitdatabaseMatka"
    JWT_SECRET: str = "changeme-please-set-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60*24*7

    class Config:
        env_file = ".env"

settings = Settings()
