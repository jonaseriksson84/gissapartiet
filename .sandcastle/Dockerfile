FROM node:22-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# Documented community workaround for the macOS Docker permission bug — sandcastle
# issue #504 (closed but the fix didn't fully land in 0.5.8). The base image's `node`
# user is renamed to `agent` (preserving UID 1000 for Podman --userns=keep-id), then
# /home/agent is explicitly chown'd + chmod'd world-writable so the container can
# write there regardless of which UID Docker Desktop runs the container as.
# https://github.com/mattpocock/sandcastle/issues/504
RUN groupmod -n agent node \
  && usermod -d /home/agent -m -l agent node \
  && chown -R agent:agent /home/agent \
  && chmod -R a+rwX /home/agent
USER agent

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Add Claude to PATH
ENV PATH="/home/agent/.local/bin:$PATH"

# Re-apply the world-writable chmod after the claude installer creates ~/.claude/
# and ~/.claude.json with default-restrictive perms. Per sandcastle issue #502.
# https://github.com/mattpocock/sandcastle/issues/502
USER root
RUN chmod -R a+rwX /home/agent
USER agent

WORKDIR /home/agent

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
# Structure your Dockerfile so that /home/agent/workspace can serve as the project root.
ENTRYPOINT ["sleep", "infinity"]
