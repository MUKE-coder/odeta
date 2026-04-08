import type { FileSystem } from "./file-system";

export async function compileProject(fileSystem: FileSystem): Promise<string> {
  const files = fileSystem.getFilesObject();

  // Get the main page content
  const pageContent = files["app/page.tsx"] || "";
  const globalsCss = files["app/globals.css"] || "";

  // Collect all component files from the components/ directory
  const componentFiles = Object.entries(files).filter(
    ([path]) =>
      path.startsWith("components/") &&
      (path.endsWith(".tsx") || path.endsWith(".jsx") || path.endsWith(".ts"))
  );

  const transformComponent = (code: string, componentName = "App") => {
    return code
      .replace(/'use client';?|"use client";?/g, "")
      .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, "")
      .replace(
        /export\s+default\s+function\s+\w+/g,
        `function ${componentName}`
      )
      .replace(/export\s+function\s+(\w+)/g, "function $1")
      .replace(/export\s+default\s+/g, `const ${componentName} = `)
      .replace(/export\s+/g, "");
  };

  // Transform all component files, preserving their exported function names
  const compiledComponents = componentFiles
    .map(([, content]) => {
      return content
        .replace(/'use client';?|"use client";?/g, "")
        .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, "")
        .replace(/export\s+default\s+function\s+(\w+)/g, "function $1")
        .replace(/export\s+function\s+(\w+)/g, "function $1")
        .replace(/export\s+default\s+/g, "const DefaultComponent = ")
        .replace(/export\s+const\s+/g, "const ")
        .replace(/export\s+/g, "");
    })
    .join("\n\n");

  const compiledHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Next.js 16 Sandbox Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            destructive: {
              DEFAULT: "hsl(var(--destructive))",
              foreground: "hsl(var(--destructive-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            popover: {
              DEFAULT: "hsl(var(--popover))",
              foreground: "hsl(var(--popover-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
        }
      }
    }
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 222.2 84% 4.9%;
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96%;
      --secondary-foreground: 222.2 84% 4.9%;
      --muted: 210 40% 96%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96%;
      --accent-foreground: 222.2 84% 4.9%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
    }

    ${globalsCss}

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      min-height: 100vh;
    }

    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-presets="typescript,react">
    const { useState, useEffect, useRef, useCallback, useMemo, Fragment } = React;

    function clsx(...classes) {
      return classes.filter(Boolean).join(' ');
    }

    function cn(...classes) {
      return clsx(...classes);
    }

    const Button = React.forwardRef(({ children, variant = 'default', size = 'default', className = '', onClick, disabled, type = 'button', asChild, ...props }, ref) => {
      const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
      const variants = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      };
      const sizes = {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      };

      if (asChild && React.Children.count(children) === 1) {
        const child = React.Children.only(children);
        return React.cloneElement(child, {
          className: cn(baseClasses, variants[variant], sizes[size], className, child.props.className),
          ref,
          ...props
        });
      }

      return React.createElement('button', {
        ref,
        type,
        className: cn(baseClasses, variants[variant], sizes[size], className),
        onClick,
        disabled,
        ...props
      }, children);
    });

    const Card = React.forwardRef(({ children, className = '', ...props }, ref) => {
      return React.createElement('div', {
        ref,
        className: cn('rounded-lg border bg-card text-card-foreground shadow-sm', className),
        ...props
      }, children);
    });

    const CardHeader = React.forwardRef(({ children, className = '', ...props }, ref) => {
      return React.createElement('div', {
        ref,
        className: cn('flex flex-col space-y-1.5 p-6', className),
        ...props
      }, children);
    });

    const CardTitle = React.forwardRef(({ children, className = '', ...props }, ref) => {
      return React.createElement('h3', {
        ref,
        className: cn('text-2xl font-semibold leading-none tracking-tight', className),
        ...props
      }, children);
    });

    const CardDescription = React.forwardRef(({ children, className = '', ...props }, ref) => {
      return React.createElement('p', {
        ref,
        className: cn('text-sm text-muted-foreground', className),
        ...props
      }, children);
    });

    const CardContent = React.forwardRef(({ children, className = '', ...props }, ref) => {
      return React.createElement('div', {
        ref,
        className: cn('p-6 pt-0', className),
        ...props
      }, children);
    });

    const CardFooter = React.forwardRef(({ children, className = '', ...props }, ref) => {
      return React.createElement('div', {
        ref,
        className: cn('flex items-center p-6 pt-0', className),
        ...props
      }, children);
    });

    const Input = React.forwardRef(({ className = '', type = 'text', ...props }, ref) => {
      return React.createElement('input', {
        ref,
        type,
        className: cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className),
        ...props
      });
    });

    const Badge = ({ children, variant = 'default', className = '', ...props }) => {
      const variants = {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground'
      };

      return React.createElement('div', {
        className: cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', variants[variant], className),
        ...props
      }, children);
    };

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        console.error('Preview Error:', error, errorInfo);
        this.setState({ errorInfo });
      }

      render() {
        if (this.state.hasError) {
          return React.createElement('div', {
            className: 'p-8 min-h-screen flex items-center justify-center bg-background'
          }, React.createElement(Card, { className: 'max-w-2xl w-full' }, [
            React.createElement(CardHeader, { key: 'header' }, [
              React.createElement(CardTitle, { key: 'title', className: 'text-destructive' }, 'Component Error'),
              React.createElement(CardDescription, { key: 'desc' }, 'There was an error rendering your React component.')
            ]),
            React.createElement(CardContent, { key: 'content' }, [
              React.createElement('div', { key: 'error', className: 'space-y-4' }, [
                React.createElement('div', { key: 'message' }, [
                  React.createElement('h4', { className: 'font-medium mb-2' }, 'Error Message:'),
                  React.createElement('pre', { className: 'text-sm bg-muted p-3 rounded overflow-auto' },
                    this.state.error ? this.state.error.toString() : 'Unknown error'
                  )
                ]),
                React.createElement('div', { key: 'tips' }, [
                  React.createElement('h4', { className: 'font-medium mb-2' }, 'Common Solutions:'),
                  React.createElement('ul', { className: 'text-sm text-muted-foreground space-y-1 list-disc list-inside' }, [
                    React.createElement('li', { key: '1' }, 'Check for syntax errors in JSX'),
                    React.createElement('li', { key: '2' }, 'Ensure all components are properly defined'),
                    React.createElement('li', { key: '3' }, 'Verify useState and other hooks are used correctly'),
                    React.createElement('li', { key: '4' }, 'Make sure all JSX elements are properly closed')
                  ])
                ])
              ])
            ])
          ]));
        }

        return this.props.children;
      }
    }

    try {
      // Transform all user components
      ${compiledComponents}

      // Transform main page component
      ${transformComponent(pageContent, "App")}

      const container = document.getElementById('root');
      if (ReactDOM.createRoot) {
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
      } else {
        ReactDOM.render(
          React.createElement(ErrorBoundary, null, React.createElement(App)),
          container
        );
      }

      console.log("[v0] Compilation successful");
    } catch (error) {
      console.error('Compilation Error:', error);

      const container = document.getElementById('root');
      const errorComponent = React.createElement('div', {
        className: 'p-8 min-h-screen flex items-center justify-center bg-background'
      }, React.createElement(Card, { className: 'max-w-2xl w-full' }, [
        React.createElement(CardHeader, { key: 'header' }, [
          React.createElement(CardTitle, { key: 'title', className: 'text-destructive' }, 'Compilation Error'),
          React.createElement(CardDescription, { key: 'desc' }, 'Failed to compile your React code.')
        ]),
        React.createElement(CardContent, { key: 'content' }, [
          React.createElement('pre', { className: 'text-sm bg-muted p-3 rounded overflow-auto mb-4' },
            error.toString()
          ),
          React.createElement('div', { className: 'text-sm text-muted-foreground' }, [
            React.createElement('p', { key: 'help', className: 'font-medium mb-2' }, 'Debug Steps:'),
            React.createElement('ol', { key: 'steps', className: 'list-decimal list-inside space-y-1' }, [
              React.createElement('li', { key: '1' }, 'Check the browser console for detailed errors'),
              React.createElement('li', { key: '2' }, 'Verify your JSX syntax is correct'),
              React.createElement('li', { key: '3' }, 'Ensure components return valid JSX'),
              React.createElement('li', { key: '4' }, 'Check that all variables are defined before use')
            ])
          ])
        ])
      ]));

      if (ReactDOM.createRoot) {
        const root = ReactDOM.createRoot(container);
        root.render(errorComponent);
      } else {
        ReactDOM.render(errorComponent, container);
      }
    }
  </script>
</body>
</html>
  `;

  return compiledHtml;
}
