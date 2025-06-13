FROM quay.io/unstructured-io/unstructured:latest

WORKDIR /app

RUN pip install "fastapi[standard]"

COPY ./main.py ./

CMD ["fastapi", "run", "main.py", "--port", "8089"]