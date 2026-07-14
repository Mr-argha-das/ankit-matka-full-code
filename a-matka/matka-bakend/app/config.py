from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb+srv://infozodex_db_user:absolutions@data.yycywiw.mongodb.net/ankitdatabaseMatka"
    JWT_SECRET: str = "c2f9d8a7b6e54193a8f4c1d9e7b2f5a6d3c8e1f4b9a7d2c6e5f8a1b3d9c7e4f2"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60*24*7
    CORS_ORIGINS: str = "https://game.natraj777.com,https://api.natraj777.com,http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    class Config:
        env_file = ".env"

settings = Settings()
