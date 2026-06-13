from __future__ import annotations

import os
import pickle
import threading
from pathlib import Path
from typing import Any

import cv2
import faiss
import numpy as np
from insightface.app import FaceAnalysis


class FaceEngine:
    """Face model + FAISS index only. Is file me MongoDB/FastAPI logic nahi hai."""

    def __init__(self, index_dir: str = "./data/face_index", threshold: float = 0.45, gpu_id: int = -1) -> None:
        self.dimension = 512
        self.threshold = threshold
        self.gpu_id = gpu_id
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.index_dir / "employee_faces.faiss"
        self.map_path = self.index_dir / "employee_id_map.pkl"

        self._lock = threading.RLock()
        self._model: FaceAnalysis | None = None
        self._ready = False

        self.index = self._load_or_create_index()
        self.id_map = self._load_id_map()
        self.next_faiss_id = max(self.id_map.keys(), default=-1) + 1

    @property
    def is_ready(self) -> bool:
        return self._ready

    def initialize(self) -> None:
        with self._lock:
            if self._ready:
                return

            providers = ["CPUExecutionProvider"]
            if self.gpu_id >= 0:
                providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]

            self._model = FaceAnalysis(name="buffalo_l", providers=providers)
            self._model.prepare(ctx_id=self.gpu_id, det_size=(640, 640))
            self._ready = True

    def _load_or_create_index(self) -> faiss.IndexIDMap2:
        if self.index_path.exists():
            index = faiss.read_index(str(self.index_path))
            if index.d != self.dimension:
                raise RuntimeError("FAISS index dimension mismatch. Old index delete/rebuild karo.")
            return index
        return faiss.IndexIDMap2(faiss.IndexFlatIP(self.dimension))

    def _load_id_map(self) -> dict[int, str]:
        if not self.map_path.exists():
            return {}
        with self.map_path.open("rb") as file:
            data = pickle.load(file)
        return {int(k): str(v) for k, v in data.items()}

    def _save_index(self) -> None:
        temp_index = self.index_path.with_suffix(".tmp.faiss")
        temp_map = self.map_path.with_suffix(".tmp.pkl")

        faiss.write_index(self.index, str(temp_index))
        with temp_map.open("wb") as file:
            pickle.dump(self.id_map, file)

        os.replace(temp_index, self.index_path)
        os.replace(temp_map, self.map_path)

    def _decode_image(self, image_bytes: bytes) -> np.ndarray:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Image decode nahi hui. JPG, PNG ya WEBP image bhejo.")
        return image

    def extract_embedding(self, image_bytes: bytes) -> np.ndarray | None:
        if not self._ready or self._model is None:
            raise RuntimeError("FaceEngine initialize nahi hua.")

        image = self._decode_image(image_bytes)
        faces = self._model.get(image)
        if not faces:
            return None

        largest_face = max(
            faces,
            key=lambda face: float((face.bbox[2] - face.bbox[0]) * (face.bbox[3] - face.bbox[1])),
        )

        embedding = largest_face.embedding.astype("float32")
        norm = np.linalg.norm(embedding)
        if norm == 0:
            return None
        return embedding / norm

    def add_employee_face(self, employee_id: str, image_bytes: bytes) -> dict[str, Any]:
        embedding = self.extract_embedding(image_bytes)
        if embedding is None:
            return {"success": False, "message": "Image me face detect nahi hua."}

        with self._lock:
            vector = embedding.reshape(1, -1).astype("float32")
            faiss.normalize_L2(vector)

            faiss_id = self.next_faiss_id
            self.index.add_with_ids(vector, np.array([faiss_id], dtype="int64"))
            self.id_map[faiss_id] = employee_id
            self.next_faiss_id += 1
            self._save_index()

        return {"success": True, "employee_id": employee_id, "faiss_id": faiss_id}

    def search_employee(self, image_bytes: bytes) -> dict[str, Any]:
        if self.index.ntotal == 0:
            return {"found": False, "message": "Face index empty hai."}

        embedding = self.extract_embedding(image_bytes)
        if embedding is None:
            return {"found": False, "message": "Image me face detect nahi hua."}

        with self._lock:
            query = embedding.reshape(1, -1).astype("float32")
            faiss.normalize_L2(query)
            scores, ids = self.index.search(query, 1)

        faiss_id = int(ids[0][0])
        score = float(scores[0][0])
        confidence = round(score * 100, 2)
        employee_id = self.id_map.get(faiss_id)

        if faiss_id == -1 or not employee_id:
            return {"found": False, "message": "Match nahi mila."}

        if score < self.threshold:
            return {
                "found": False,
                "employee_id": employee_id,
                "confidence": confidence,
                "message": "Reliable match nahi mila.",
            }

        return {
            "found": True,
            "employee_id": employee_id,
            "faiss_id": faiss_id,
            "score": score,
            "confidence": confidence,
            "message": "Employee matched.",
        }

    def total_faces(self) -> int:
        return int(self.index.ntotal)

