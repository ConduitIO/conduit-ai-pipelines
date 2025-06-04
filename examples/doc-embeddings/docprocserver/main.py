# Copyright © 2022 Meroxa, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import io
import base64

from fastapi import FastAPI
from pydantic import BaseModel
from unstructured.partition.auto import partition

def base64_padding(b64string):
    padding_needed = len(b64string) % 4
    if padding_needed > 0:
        b64string += '=' * (4 - padding_needed)
    return b64string

class Request(BaseModel):
    data: str

app = FastAPI()

@app.post("/unstructured/partition")
async def unstructured_partition(req: Request):
    padded = base64_padding(req.data)
    decoded = base64.b64decode(padded)
    f = io.BytesIO(decoded)
    elements = partition(file=f, include_page_breaks=True, strategy="hi_res", chunking_strategy="basic")
    return { "data": list(map(lambda e : { "category": e.category, "text": str(e)}, elements)) }
