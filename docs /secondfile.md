Setting up a Git repository
To configure a Git repository for content access in Document360,

Ensure that your Git repository is appropriately set up and configured to enable fetching the content into the Document360 project. Follow the structure below:

       Main folder:

In GitHub, the repository must include a main folder named docs where you can organize subfolders and Markdown articles.

This folder name must remain unchanged.

Media files storage:

Store all media files inside the .document360/assets folder within the docs directory.

This folder name must remain unchanged.

For example, if an image is referenced in a file named 'What is Document360', it should be moved to the .document360/assets folder.
Article storage:

Within the docs folder, create a separate directory, for example, articles to store your articles.

Articles must be in Markdown (.md) format.

Inserting media files in articles:

Upload the media file to the .document360/assets folder.

Use the following syntax to insert the media file into your article:
