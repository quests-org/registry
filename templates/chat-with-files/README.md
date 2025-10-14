# AI Chat with Files

A React application that allows users to upload files and have AI-powered conversations about those files.

## Features

- File upload and management
- AI chat interface powered by OpenAI
- File selection to provide context for the AI conversation
- Preview support for image files

## Usage

1. Upload files using the file upload section on the left
2. Select one or more files to include in your conversation by checking the checkboxes
3. Start chatting with the AI in the chat section on the right
4. The AI will have access to the information about the files you've selected

## Implementation Details

This application combines two key features:

1. **File Management**: Using ORPC (object-remote-procedure-call) for file operations (upload, download, list, delete)
2. **AI Chat**: Using AI SDK with OpenAI to power the chat interface

The application demonstrates how to:

- Pass file metadata to the AI context
- Handle file uploads with previews
- Create a chat interface

## License

MIT
