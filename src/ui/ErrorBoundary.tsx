import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onReset?: () => void
}
interface State {
  error: Error | null
}

/** Never crash: one boundary around each screen with a pixel "glitch" fallback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Scam Town] screen crashed', error, info.componentStack)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="scanlines relative flex h-full flex-col items-center justify-center gap-3 bg-paper p-6 text-center text-ink">
        <div className="text-5xl">📺</div>
        <h2 className="text-lg">SIGNAL LOST</h2>
        <p className="text-sm text-ink/70">{this.state.error.message}</p>
        <button
          className="pixel-btn mt-2 min-h-[48px] bg-marigold px-5 text-[#07080f]"
          onClick={() => {
            this.setState({ error: null })
            this.props.onReset?.()
          }}
        >
          BACK TO TITLE
        </button>
      </div>
    )
  }
}
