# Initialize the example.
init: check-prerequisites ollama-init supabase-up chatbot-ui-init supabase-down

# Start the example.
up: check-prerequisites supabase-up unstructured-up chatbot-ui-up conduit-up
	@echo ""
	@echo "Waiting for services to start..."
	@sleep 3
	@echo "Opening the chatbot UI in your browser (open http://localhost:3000 if it doesn't open automatically)."
	@open http://localhost:3000

# Stop the example.
down: check-prerequisites chatbot-ui-down unstructured-down supabase-down conduit-down

# -- Helpers ----------------------------------------

# Check if commands are installed.
check-prerequisites:
	@command -v supabase >/dev/null 2>&1 || { echo >&2 "Supabase is required but not installed. Aborting."; exit 1; }
	@command -v ollama >/dev/null 2>&1 || { echo >&2 "Ollama is required but not installed. Aborting."; exit 1; }
	@command -v conduit >/dev/null 2>&1 || { echo >&2 "Conduit is required but not installed. Aborting."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo >&2 "NPM is required but not installed. Aborting."; exit 1; }
	@set -a; . ./.env; \
    	[ -n "$$AWS_ACCESS_KEY" ] || { echo >&2 "AWS_ACCESS_KEY is not set in .env. Aborting."; exit 1; }; \
    	[ -n "$$AWS_ACCESS_SECRET" ] || { echo >&2 "AWS_ACCESS_SECRET is not set in .env. Aborting."; exit 1; }; \
    	[ -n "$$AWS_REGION" ] || { echo >&2 "AWS_REGION is not set in .env. Aborting."; exit 1; }; \
    	[ -n "$$AWS_BUCKET" ] || { echo >&2 "AWS_BUCKET is not set in .env. Aborting."; exit 1; }

# Clone the chatbot-ui repository.
chatbot-ui:
	git clone git@github.com:ConduitIO/chatbot-ui.git
	cd ./chatbot-ui && \
		npm install

# Prepare the .env.local file for chatbot-ui.
chatbot-ui-update-env-local: chatbot-ui
	@if [ ! -f ./chatbot-ui/.env.local ]; then \
		cp ./chatbot-ui/.env.local.example ./chatbot-ui/.env.local; \
	else \
		echo ".env.local already exists, using existing file"; \
	fi
	./scripts/chatbot-ui-init.sh ./chatbot-ui

# Update the service_role key in the SQL migration file.
chatbot-ui-update-service-role-key: chatbot-ui
	@SERVICE_ROLE_KEY=$$(supabase status --workdir ./chatbot-ui | grep "service_role key:" | cut -d' ' -f3) && \
	sed -i.bak "s/service_role_key TEXT := '[^']*/service_role_key TEXT := '$$SERVICE_ROLE_KEY'/" ./chatbot-ui/supabase/migrations/20240108234540_setup.sql && \
	echo "Updated service_role key in migration file"

# Initialize the chatbot-ui repository and prepare the environment.
chatbot-ui-init: chatbot-ui chatbot-ui-update-service-role-key chatbot-ui-update-env-local

# Install required ollama models.
ollama-init:
	ollama pull all-minilm:l6-v2
	ollama pull deepseek-r1:8b

# Start supabase.
supabase-up: chatbot-ui
	supabase start --workdir ./chatbot-ui

# Stop supabase.
supabase-down:
	supabase stop --workdir ./chatbot-ui

# Start unstructured service.
unstructured-up:
	docker compose -f unstructured/compose.yaml up -d

# Start unstructured service.
unstructured-down:
	docker compose -f unstructured/compose.yaml down

# Start the chatbot UI.
chatbot-ui-up: chatbot-ui
	@echo "Starting the chatbot UI in the background..."
	cd ./chatbot-ui && npm run chat

# Stop the chatbot UI.
chatbot-ui-down:
	# Stop based on the port it runs on (3000). Note: This assumes chatbot-ui is running on port 3000.
	@echo "Attempting to stop the chatbot UI..."
	@PID=$$(lsof -ti :3000) && \
	if [ -n "$$PID" ]; then \
	   echo "Found process $$PID on port 3000. Terminating..."; \
	   kill -2 $$PID; \
	else \
	   echo "No process found running on port 3000."; \
	fi

# Start conduit.
conduit-up:
	@echo "Starting conduit in the background..."
	conduit run --preview.pipeline-arch-v2

# Stop conduit.
conduit-down:
	# Stop based on the port it runs on (8080). Note: This assumes conduit is running on port 8080.
	@echo "Attempting to stop conduit..."
	@PID=$$(lsof -ti :8080) && \
	if [ -n "$$PID" ]; then \
	   echo "Found process $$PID on port 8080. Terminating..."; \
	   kill -2 $$PID; \
	else \
	   echo "No process found running on port 8080."; \
	fi