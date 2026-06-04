from typing import Any

from app.repositories.base import BaseRepository


class BaseService:
    search_fields: list[str] = []

    def __init__(self, repository: BaseRepository):
        self.repository = repository

    def list(self, page: int = 1, page_size: int = 20, search: str | None = None, sort: str = "-created_at", **filters):
        return self.repository.list(filters=filters, search=search, search_fields=self.search_fields, page=page, page_size=page_size, sort=sort)

    def get(self, object_id: str):
        return self.repository.get(object_id)

    def create(self, data: dict[str, Any]):
        return self.repository.create(data)

    def update(self, object_id: str, data: dict[str, Any]):
        return self.repository.update(object_id, data)

    def delete(self, object_id: str):
        self.repository.delete(object_id)
