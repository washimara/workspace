import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToastType = Toast

interface ToasterToast extends ToastType {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

function toastReducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      if (toastId === undefined) {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
            open: false,
          })),
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      }
    }

    case actionTypes.REMOVE_TOAST: {
      const { toastId } = action

      if (toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      }
    }
  }
}

function useToast() {
  const [state, dispatch] = React.useReducer(toastReducer, {
    toasts: [],
  })

  React.useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    state.toasts
      .filter((t) => t.open === false)
      .forEach((t) => {
        if (timers.has(t.id)) return

        const timer = setTimeout(() => {
          dispatch({ type: actionTypes.REMOVE_TOAST, toastId: t.id })
          timers.delete(t.id)
        }, TOAST_REMOVE_DELAY)

        timers.set(t.id, timer)
      })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [state.toasts])

  const toast = React.useCallback(
    ({ ...props }: ToastProps) => {
      const id = genId()

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) {
              dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
            }
          },
        },
      })

      return id
    },
    [dispatch]
  )

  const update = React.useCallback(
    (id: string, toast: ToasterToast) => {
      dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...toast, id } })
    },
    [dispatch]
  )

  const dismiss = React.useCallback(
    (id: string) => {
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })
    },
    [dispatch]
  )

  return {
    toast,
    update,
    dismiss,
    toasts: state.toasts,
  }
}

import * as React from "react"

export type ToastOptions = ToastProps

export { useToast }