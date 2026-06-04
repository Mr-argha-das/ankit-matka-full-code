from celery import Celery

from app.core.config import settings

celery_app = Celery("attendance_saas", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.timezone = "UTC"
