import { useEffect } from 'react';
import { DEFAULT_CODE_BLOCK_LABELS, type CodeBlockLabels } from '@api/utils/articleHtml';

interface CodeBlockEnhancerProps {
    labels?: CodeBlockLabels;
}

export default function CodeBlockEnhancer({
    labels = DEFAULT_CODE_BLOCK_LABELS,
}: CodeBlockEnhancerProps) {
    useEffect(() => {
        const codeBlockShells = Array.from(
            document.querySelectorAll<HTMLElement>('.solitude-article-content .code-block-shell')
        );
        const disposers: Array<() => void> = [];

        codeBlockShells.forEach((shell) => {
            const pre = shell.querySelector<HTMLPreElement>('pre');
            const wrapButton = shell.querySelector<HTMLButtonElement>('[data-code-wrap]');
            const copyButton = shell.querySelector<HTMLButtonElement>('[data-code-copy]');
            const lineToggleButton = shell.querySelector<HTMLButtonElement>(
                '[data-code-toggle-lines]'
            );
            const status = shell.querySelector<HTMLElement>('[data-code-status]');
            if (!pre || !wrapButton || !copyButton) return;

            const code = pre.querySelector<HTMLElement>('code');

            const updateWrapButton = () => {
                const label = shell.classList.contains('is-wrapped') ? labels.scroll : labels.wrap;
                wrapButton.textContent = label;
                wrapButton.setAttribute('aria-label', label);
                wrapButton.setAttribute('title', label);
            };

            const updateLineToggleButton = () => {
                if (!lineToggleButton) return;

                const isExpanded = shell.classList.contains('is-expanded');
                const label = isExpanded ? labels.collapse : labels.expand;
                lineToggleButton.textContent = label;
                lineToggleButton.setAttribute('aria-label', label);
                lineToggleButton.setAttribute('title', label);
                lineToggleButton.setAttribute('aria-expanded', String(isExpanded));
            };

            updateWrapButton();
            updateLineToggleButton();
            copyButton.textContent = labels.copy;
            copyButton.setAttribute('aria-label', labels.copy);
            copyButton.setAttribute('title', labels.copy);

            const handleWrap = () => {
                shell.classList.toggle('is-wrapped');
                updateWrapButton();
            };

            const handleCopy = async () => {
                const text = code?.textContent ?? pre.textContent ?? '';
                if (!text.trim()) return;

                try {
                    await navigator.clipboard.writeText(text);
                    copyButton.textContent = labels.copied;
                    copyButton.setAttribute('aria-label', labels.copied);
                    copyButton.setAttribute('title', labels.copied);
                    if (status) status.textContent = labels.copied;
                    window.setTimeout(() => {
                        copyButton.textContent = labels.copy;
                        copyButton.setAttribute('aria-label', labels.copy);
                        copyButton.setAttribute('title', labels.copy);
                        if (status) status.textContent = '';
                    }, 1400);
                } catch {
                    copyButton.textContent = labels.failed;
                    copyButton.setAttribute('aria-label', labels.failed);
                    copyButton.setAttribute('title', labels.failed);
                    if (status) status.textContent = labels.failed;
                    window.setTimeout(() => {
                        copyButton.textContent = labels.copy;
                        copyButton.setAttribute('aria-label', labels.copy);
                        copyButton.setAttribute('title', labels.copy);
                        if (status) status.textContent = '';
                    }, 1400);
                }
            };

            const handleLineToggle = () => {
                shell.classList.toggle('is-expanded');
                updateLineToggleButton();
            };

            wrapButton.addEventListener('click', handleWrap);
            copyButton.addEventListener('click', handleCopy);
            lineToggleButton?.addEventListener('click', handleLineToggle);
            disposers.push(() => {
                wrapButton.removeEventListener('click', handleWrap);
                copyButton.removeEventListener('click', handleCopy);
                lineToggleButton?.removeEventListener('click', handleLineToggle);
            });
        });

        return () => {
            disposers.forEach((dispose) => dispose());
        };
    }, [
        labels.collapse,
        labels.copy,
        labels.copied,
        labels.expand,
        labels.failed,
        labels.scroll,
        labels.wrap,
    ]);

    return null;
}
