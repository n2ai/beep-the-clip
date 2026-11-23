from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    AWS_REGION: str = "us-east-1"
    COGNITO_USER_POOL_ID: str
    COGNITO_CLIENT_ID: str
    S3_BUCKET_NAME: str
    FRONTEND_ORIGIN: str = "http://localhost:5173"


settings = Settings()
