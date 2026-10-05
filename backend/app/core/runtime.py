from app.core.config import settings
from app.core.resource_manager import ResourceManager
from app.inference.model_manager import ModelManager
from app.inference.inference_service import InferenceService

resource_manager = ResourceManager(
    max_concurrent_inference=settings.max_concurrent_inference
)

model_manager = ModelManager(
    max_models=settings.max_models,
    intra_op_threads=settings.intra_op_threads,
    inter_op_threads=settings.inter_op_threads,
    gpu_mem_limit_gb=settings.gpu_mem_limit_gb or None,  # 0 → None → unlimited
)

inference_service = InferenceService(
    model_manager=model_manager,
    resource_manager=resource_manager,
)
