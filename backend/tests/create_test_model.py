import onnx
from onnx import helper, TensorProto
from pathlib import Path

model_path = Path("models") / "test_model.onnx"
model_path.parent.mkdir(parents=True, exist_ok=True)

X = helper.make_tensor_value_info(
    "input",
    TensorProto.FLOAT,
    [1, 4],
)

Y = helper.make_tensor_value_info(
    "output",
    TensorProto.FLOAT,
    [1, 4],
)

node = helper.make_node(
    "Relu",
    ["input"],
    ["output"],
)

graph = helper.make_graph(
    [node],
    "TestModel",
    [X],
    [Y],
)

model = helper.make_model(
    graph,
    producer_name="SIH26187-Test",
    opset_imports=[helper.make_opsetid("", 13)],
)

onnx.checker.check_model(model)
onnx.save(model, model_path)

print("Test ONNX model created:", model_path)
print("File exists:", model_path.exists())
print("File size:", model_path.stat().st_size, "bytes")
