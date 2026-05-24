# beads-dashboard

Real-time kanban dashboard for [bd (beads)](https://github.com/gastownhall/beads) issue tracking. Run it from any project that uses beads.

## Prerequisites

- **bd** installed and available in `PATH`
- A project with `.beads/` initialised (`bd init` run at least once)

## Usage

```sh
npx beads-dashboard
```

Opens the dashboard at `http://localhost:3003`. The board shows your beads tasks grouped by epic, with columns for open (blocked), ready, in-progress, and done. Updates in real time as you run `bd` commands.

### Options

```
--port <n>   Port to listen on (default: 3003)
--open       Open in your default browser on startup
--help, -h   Show help
```

### Examples

```sh
npx beads-dashboard --open          # start and open browser
npx beads-dashboard --port 4000     # use a different port
```

## Install beads

```sh
brew install gastownhall/tap/bd
```

See the [beads repository](https://github.com/gastownhall/beads) for full installation instructions.
