# OpenAI-Compatible API Support

This plugin now supports OpenAI-compatible APIs in addition to the original OpenAI API. This allows you to use services like Qwen (Alibaba Cloud), DeepSeek, and other providers that implement the OpenAI API format.

## Supported Providers

### Built-in Models

The plugin includes pre-configured models for:

- **Qwen Models** (Alibaba Cloud DashScope):
  - Qwen2.5 72B Instruct
  - Qwen2.5 14B Instruct  
  - Qwen2.5 7B Instruct

- **DeepSeek Models**:
  - DeepSeek Chat

- **OpenAI Models** (original support):
  - GPT 4.1 nano (recommended)
  - GPT 4.1 mini
  - GPT 4.1

## Configuration

### For Qwen (Alibaba Cloud DashScope)

1. **Get API Key**: Sign up at [Alibaba Cloud DashScope](https://dashscope.aliyuncs.com/) and get your API key
2. **Configure Plugin**:
   - Custom API Key: `your-dashscope-api-key`
   - Custom API Endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1`
   - Model: Select any Qwen model from the dropdown

### For DeepSeek

1. **Get API Key**: Sign up at [DeepSeek Platform](https://platform.deepseek.com/) and get your API key
2. **Configure Plugin**:
   - Custom API Key: `your-deepseek-api-key`
   - Custom API Endpoint: `https://api.deepseek.com/v1`
   - Model: Select "DeepSeek Chat" from the dropdown

### For Other OpenAI-Compatible APIs

1. **Get API credentials** from your provider
2. **Configure Plugin**:
   - Custom API Key: Your provider's API key
   - Custom API Endpoint: Your provider's base URL (e.g., `https://api.example.com/v1`)
   - Model: Select an appropriate model or use a custom model name

## Usage

1. Open the plugin settings in Obsidian
2. Fill in your custom API key and endpoint
3. Select the desired model from the dropdown
4. Use the proofreading commands as usual:
   - "Proofread selection/paragraph"
   - "Proofread full document"
   - Accept/reject suggestions

## Notes

- The plugin automatically appends `/chat/completions` to your endpoint if not present
- Custom models use the same token limits as the built-in models (32,768 tokens)
- You can use either OpenAI API or custom API, but not both simultaneously
- Make sure your custom API endpoint supports the OpenAI chat completions format

## Troubleshooting

- **401 Unauthorized**: Check that your API key is correct
- **Connection errors**: Verify your endpoint URL is correct and accessible
- **Model not found**: Ensure the model name matches what your provider expects