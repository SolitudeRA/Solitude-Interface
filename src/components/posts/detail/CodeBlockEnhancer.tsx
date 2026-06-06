import { useEffect } from 'react';

function getLanguage(pre: HTMLPreElement, code: HTMLElement | null): string {
    const languageFromData = pre.dataset.language || code?.dataset.language;
    if (languageFromData) return languageFromData;

    const className = `${pre.className} ${code?.className ?? ''}`;
    const match = className.match(/language-([a-z0-9_+-]+)/i);

    return match?.[1]?.replace(/_/g, ' ') ?? 'code';
}

function createToolbarButton(label: string, className: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
}

export default function CodeBlockEnhancer() {
    useEffect(() => {
        const preBlocks = Array.from(
            document.querySelectorAll<HTMLPreElement>('.solitude-article-content pre')
        );
        const disposers: Array<() => void> = [];

        preBlocks.forEach((pre, index) => {
            if (pre.closest('.code-block-shell')) return;

            const code = pre.querySelector<HTMLElement>('code');
            const shell = document.createElement('div');
            shell.className = 'code-block-shell';
            shell.dataset.codeBlock = String(index + 1);

            const toolbar = document.createElement('div');
            toolbar.className = 'code-block-toolbar';

            const label = document.createElement('span');
            label.className = 'code-block-language';
            label.textContent = getLanguage(pre, code).toUpperCase();

            const actions = document.createElement('div');
            actions.className = 'code-block-actions';

            const wrapButton = createToolbarButton('Wrap', 'code-block-action');
            const copyButton = createToolbarButton('Copy', 'code-block-action');

            const handleWrap = () => {
                shell.classList.toggle('is-wrapped');
                wrapButton.textContent = shell.classList.contains('is-wrapped') ? 'Scroll' : 'Wrap';
            };

            const handleCopy = async () => {
                const text = code?.textContent ?? pre.textContent ?? '';
                if (!text.trim()) return;

                try {
                    await navigator.clipboard.writeText(text);
                    copyButton.textContent = 'Copied';
                    window.setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 1400);
                } catch {
                    copyButton.textContent = 'Failed';
                    window.setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 1400);
                }
            };

            wrapButton.addEventListener('click', handleWrap);
            copyButton.addEventListener('click', handleCopy);
            disposers.push(() => {
                wrapButton.removeEventListener('click', handleWrap);
                copyButton.removeEventListener('click', handleCopy);
            });

            actions.append(wrapButton, copyButton);
            toolbar.append(label, actions);

            pre.before(shell);
            shell.append(toolbar, pre);
        });

        return () => {
            disposers.forEach((dispose) => dispose());
        };
    }, []);

    return null;
}
