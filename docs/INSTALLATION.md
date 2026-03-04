# Installation Guide

## Requirements

- [bun](https://bun.sh) 1.0 or higher (recommended)
- Node.js 18 or higher (alternative)
- Monica CRM instance with API access

## Installation Methods

### npm

```bash
npm install -g monica-cli
```

### From Source (Recommended)

Using [bun](https://bun.sh):

```bash
git clone https://github.com/unbraind/monica-cli.git
cd monica-cli
bun install
bun run build
bun link
```

### Using npx

```bash
npx monica-cli contacts list
```

### Using bunx

```bash
bunx monica-cli contacts list
```

## Configuration

### Global Settings File (Recommended)

Create `~/.monica-cli/settings.json`:

```json
{
  "apiUrl": "https://your-instance.com/api",
  "apiKey": "your-jwt-token"
}
```

This method keeps credentials out of your project directory.

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Required
MONICA_API_URL=https://your-instance.com/api
MONICA_API_KEY=your-jwt-token

# Optional (for some operations)
MONICA_USER_EMAIL=your-email@example.com
MONICA_USER_PASSWORD=your-password
```

### Getting Your API Key

1. Log in to your Monica instance
2. Go to Settings > Integrations
3. Create a new API token
4. Copy the token to your environment

### Verify Installation

```bash
monica --version
monica user get
```

## Shell Completion

### Bash

Add to `~/.bashrc`:

```bash
eval "$(monica completion bash)"
```

### Zsh

Add to `~/.zshrc`:

```zsh
eval "$(monica completion zsh)"
```

### Fish

Add to `~/.config/fish/config.fish`:

```fish
monica completion fish | source
```

## Troubleshooting

### Connection Issues

If you see connection errors:

1. Verify your `MONICA_API_URL` is correct (should end with `/api`)
2. Check that your instance is accessible
3. Ensure SSL certificates are valid

### Authentication Errors

If you see authentication errors:

1. Verify your `MONICA_API_KEY` is correct
2. Check if your token has expired
3. Ensure your token has the necessary permissions

### Rate Limiting

Monica API has a rate limit of 60 requests per minute. If you hit the limit:

1. Wait a minute before retrying
2. Use pagination instead of fetching all data at once
3. Reduce the frequency of API calls
