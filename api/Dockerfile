FROM python:3.8.6

# Uncomment the following lines to make PyTorch available to your application.
# See https://skiff.allenai.org/gpu.html for more details.
#
# ENV LD_LIBRARY_PATH /usr/local/nvidia/lib:/usr/local/nvidia/lib64
# ENV NVIDIA_VISIBLE_DEVICES all
# ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
# RUN pip install torch==1.7.0+cu101 -f https://download.pytorch.org/whl/torch_stable.html

WORKDIR /api

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

# Copy over the source code
COPY app app/
COPY start.py .

RUN apt-get update
RUN apt-get -y install libgl1
RUN apt-get -y install poppler-utils

# Kick things off
ENTRYPOINT [ "python" ]
CMD [ "start.py" ]
