<p align="center">
<img src="./src/assets/icons/sagittarius-wordmark.svg" alt="Sagittarius Logo">
</p>

<hr style="margin: 20px 0;">

<p align="justify">
<strong>Sagittarius</strong> is an open-source local platform for answering most of your needs. It started as personal project to solve my own needs, but I decided to share it with the world. It is built using modern web technologies and is designed to be easy to use and extendable. It is currently in early development, but I am excited to see where it goes in the future. 
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Ollama-fff?logo=ollama&logoColor=000000" alt="Ollama" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vue.js-4FC08D?logo=vuedotjs&logoColor=fff" alt="Vue.js" />
</p>

## Features

- **Local LLM Hosting**: Host your own language models locally using Ollama, ensuring data privacy and control.
- **User-Friendly Interface**: A sleek and intuitive interface built with Vue.js for easy interaction with your local LLMs.

> [!NOTE]
> Sagittarius is currently in early development, and features are subject to change. Stay tuned for updates and new functionalities!

## Installation

1. Clone the repository:

```bash
git clone https://github.com/moonlight58/sagittarius.git
cd sagittarius
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

<hr>

<h3>OPTIONAL :</h3>

4. If you're on Linux, you can create a systemd service to run the application in the background:

```bash
sudo nano /etc/systemd/system/sagittarius.service
```

> [!IMPORTANT]
> make sure you install `serve` globally to serve the production build:

```bash
npm install -g serve
```

Add the following content to the file:

```ini
[Unit]
Description=Sagittarius Local Platform
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/sagittarius
ExecStart=/usr/bin/serve -s /path/to/sagittarius/dist -l 9999
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Replace `/path/to/sagittarius` with the actual path to your cloned repository.

5. Enable and start the service:

```bash
sudo systemctl enable sagittarius
sudo systemctl start sagittarius
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
