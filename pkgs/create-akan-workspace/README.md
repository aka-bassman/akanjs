# 🚀 Create Akan Workspace

The quickest way to bootstrap a new Akan.js workspace with a single command. This package provides a streamlined entry point that automatically installs the Akan.js CLI and creates your workspace in one step.

## ⚡ Get Started

The fastest way to create a new Akan.js workspace:

```bash
bunx create-akan-workspace
```

That's it! This single command will:

1. Install the latest `akanjs` globally
2. Run the interactive workspace creation wizard
3. Set up your development environment

### Quick Setup Examples

```bash
# Interactive mode (recommended)
bunx create-akan-workspace

# Specify organization name
bunx create-akan-workspace "my-company"

# Full setup with options
bunx create-akan-workspace "my-company" --app "web-app" --dir "./projects"
```

## 📋 Options

| Option             | Description                    | Example            |
| ------------------ | ------------------------------ | ------------------ |
| `[org]`            | Organization name (positional) | `my-company`       |
| `-a, --app <name>` | Initial application name       | `--app web-app`    |
| `-d, --dir <path>` | Target directory               | `--dir ./projects` |

## 🎯 What Happens Next

After running `create-akan-workspace`, you'll have:

1. **✅ Akan.js CLI installed globally** - Access to all `akan` commands
2. **🏗️ Workspace created** - Organized project structure
3. **📱 Initial application** - Ready-to-run starter app
4. **🔧 Development environment** - Configured tooling and dependencies

### Start developing immediately:

```bash
cd <workspace-name>
akan start <app-name> --open
```

Navigate to http://localhost:4200 to see your app running!

## 🛠️ Requirements

- **Bun.js** >=1.3

## 🔗 What's Next?

After creating your workspace, explore the full power of Akan.js CLI:

```bash
# Scaffold a domain module
akan create-module

# Run the dev server
akan start <app-name>

# Build for production
akan build <app-name>
```

## 📚 Learn More

- [`akanjs`](../akanjs) - Full CLI documentation and features
- [Akan.js Documentation](https://docs.akanjs.com) - Complete development guide
- [Examples](https://github.com/akan-team/examples) - Sample projects and tutorials

## 🤝 Contributing

This package is part of the Akan.js ecosystem. Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is part of the Akan.js ecosystem. See the main repository for license information.

---

<p align="center">
  <strong>Built with ❤️ by the Akan.js team</strong><br>
  <em></em>
</p>
