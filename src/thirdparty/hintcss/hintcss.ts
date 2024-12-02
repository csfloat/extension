import {css} from 'lit';
export const hintcss = css`
    /*! Hint.css - v3.0.0 - 2023-11-29
* https://kushagra.dev/lab/hint/
* Copyright (c) 2023 Kushagra Gour */

    [class*='hint--'] {
        position: relative;
        display: inline-block;
    }
    [class*='hint--']:after,
    [class*='hint--']:before {
        position: absolute;
        transform: translate3d(0, 0, 0);
        visibility: hidden;
        opacity: 0;
        z-index: 1000000;
        pointer-events: none;
        transition: 0.3s ease;
        transition-delay: 0s;
    }
    [class*='hint--']:hover:after,
    [class*='hint--']:hover:before {
        visibility: visible;
        opacity: 1;
        transition-delay: 0.1s;
    }
    [class*='hint--']:before {
        content: '';
        position: absolute;
        background: #383838;
        border: 6px solid transparent;
        clip-path: polygon(0 0, 100% 0, 100% 100%);
        z-index: 1000001;
    }
    [class*='hint--']:after {
        background: #383838;
        color: #fff;
        padding: 8px 10px;
        font-size: 1rem;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        line-height: 1rem;
        white-space: nowrap;
        text-shadow: 0 1px 0 #000;
        box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
    }
    .hint--error:after,
    .hint--error:before {
        background-color: #b24e4c;
    }
    [class*='hint--'][aria-label]:after {
        content: attr(aria-label);
    }
    [class*='hint--'][data-hint]:after {
        content: attr(data-hint);
    }
    [aria-label='']:after,
    [aria-label='']:before,
    [data-hint='']:after,
    [data-hint='']:before {
        display: none !important;
    }
    .hint--top {
        --rotation: 135deg;
    }
    .hint--top:after,
    .hint--top:before {
        bottom: 100%;
        left: 50%;
    }
    .hint--top:before {
        margin-bottom: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--top:after {
        transform: translateX(-50%);
    }
    .hint--top:hover:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--top:hover:after {
        transform: translateX(-50%) translateY(-8px);
    }
    .hint--bottom {
        --rotation: -45deg;
    }
    .hint--bottom:after,
    .hint--bottom:before {
        top: 100%;
        left: 50%;
    }
    .hint--bottom:before {
        margin-top: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--bottom:after {
        transform: translateX(-50%);
    }
    .hint--bottom:hover:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--bottom:hover:after {
        transform: translateX(-50%) translateY(8px);
    }
    .hint--right {
        --rotation: -135deg;
    }
    .hint--right:before {
        margin-left: -5.5px;
        margin-bottom: -6px;
        transform: rotate(var(--rotation));
    }
    .hint--right:after {
        margin-bottom: calc(-1 * (1rem + 16px) / 2);
    }
    .hint--right:after,
    .hint--right:before {
        left: 100%;
        bottom: 50%;
    }
    .hint--right:hover:before {
        transform: translateX(8px) rotate(var(--rotation));
    }
    .hint--right:hover:after {
        transform: translateX(8px);
    }
    .hint--left {
        --rotation: 45deg;
    }
    .hint--left:before {
        margin-right: -5.5px;
        margin-bottom: -6px;
        transform: rotate(var(--rotation));
    }
    .hint--left:after {
        margin-bottom: calc(-1 * (1rem + 16px) / 2);
    }
    .hint--left:after,
    .hint--left:before {
        right: 100%;
        bottom: 50%;
    }
    .hint--left:hover:before {
        transform: translateX(-8px) rotate(var(--rotation));
    }
    .hint--left:hover:after {
        transform: translateX(-8px);
    }
    .hint--top-left {
        --rotation: 135deg;
    }
    .hint--top-left:after,
    .hint--top-left:before {
        bottom: 100%;
        left: 50%;
    }
    .hint--top-left:before {
        margin-bottom: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--top-left:after {
        transform: translateX(-100%);
        margin-left: 12px;
    }
    .hint--top-left:hover:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--top-left:hover:after {
        transform: translateX(-100%) translateY(-8px);
    }
    .hint--top-right {
        --rotation: 135deg;
    }
    .hint--top-right:after,
    .hint--top-right:before {
        bottom: 100%;
        left: 50%;
    }
    .hint--top-right:before {
        margin-bottom: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--top-right:after {
        transform: translateX(0);
        margin-left: -12px;
    }
    .hint--top-right:hover:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--top-right:hover:after {
        transform: translateY(-8px);
    }
    .hint--bottom-left {
        --rotation: -45deg;
    }
    .hint--bottom-left:after,
    .hint--bottom-left:before {
        top: 100%;
        left: 50%;
    }
    .hint--bottom-left:before {
        margin-top: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--bottom-left:after {
        transform: translateX(-100%);
        margin-left: 12px;
    }
    .hint--bottom-left:hover:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--bottom-left:hover:after {
        transform: translateX(-100%) translateY(8px);
    }
    .hint--bottom-right {
        --rotation: -45deg;
    }
    .hint--bottom-right:after,
    .hint--bottom-right:before {
        top: 100%;
        left: 50%;
    }
    .hint--bottom-right:before {
        margin-top: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--bottom-right:after {
        transform: translateX(0);
        margin-left: -12px;
    }
    .hint--bottom-right:hover:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--bottom-right:hover:after {
        transform: translateY(8px);
    }
    .hint--fit:after,
    .hint--large:after,
    .hint--medium:after,
    .hint--small:after {
        box-sizing: border-box;
        white-space: normal;
        line-height: 1.4em;
        word-wrap: break-word;
    }
    .hint--small:after {
        width: 80px;
    }
    .hint--medium:after {
        width: 150px;
    }
    .hint--large:after {
        width: 300px;
    }
    .hint--fit:after {
        width: 100%;
    }
    .hint--error:after {
        text-shadow: 0 1px 0 #592726;
    }
    .hint--warning:after,
    .hint--warning:before {
        background-color: #bf9853;
    }
    .hint--warning:after {
        text-shadow: 0 1px 0 #6c5328;
    }
    .hint--info:after,
    .hint--info:before {
        background-color: #3985ac;
    }
    .hint--info:after {
        text-shadow: 0 1px 0 #1a3c4d;
    }
    .hint--success:after,
    .hint--success:before {
        background-color: #458646;
    }
    .hint--success:after {
        text-shadow: 0 1px 0 #1a321a;
    }
    .hint--always:after,
    .hint--always:before {
        opacity: 1;
        visibility: visible;
    }
    .hint--always.hint--top:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--top:after {
        transform: translateX(-50%) translateY(-8px);
    }
    .hint--always.hint--top-left:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--top-left:after {
        transform: translateX(-100%) translateY(-8px);
    }
    .hint--always.hint--top-right:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--top-right:after {
        transform: translateY(-8px);
    }
    .hint--always.hint--bottom:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--always.hint--bottom:after {
        transform: translateX(-50%) translateY(8px);
    }
    .hint--always.hint--bottom-left:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--always.hint--bottom-left:after {
        transform: translateX(-100%) translateY(8px);
    }
    .hint--always.hint--bottom-right:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--always.hint--bottom-right:after {
        transform: translateY(8px);
    }
    .hint--always.hint--left:before {
        transform: translateX(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--left:after {
        transform: translateX(-8px);
    }
    .hint--always.hint--right:before {
        transform: translateX(8px) rotate(var(--rotation));
    }
    .hint--always.hint--right:after {
        transform: translateX(8px);
    }
    .hint--rounded:before {
        border-radius: 0 4px 0 0;
    }
    .hint--rounded:after {
        border-radius: 4px;
    }
    .hint--no-animate:after,
    .hint--no-animate:before {
        transition-duration: 0s;
    }
    .hint--bounce:after,
    .hint--bounce:before {
        transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s cubic-bezier(0.71, 1.7, 0.77, 1.24);
    }
    @supports (transition-timing-function: linear(0, 1)) {
        .hint--bounce:after,
        .hint--bounce:before {
            --spring-easing: linear(
                0,
                0.009,
                0.035 2.1%,
                0.141 4.4%,
                0.723 12.9%,
                0.938,
                1.077 20.4%,
                1.121,
                1.149 24.3%,
                1.159,
                1.163 27%,
                1.154,
                1.129 32.8%,
                1.051 39.6%,
                1.017 43.1%,
                0.991,
                0.977 51%,
                0.975 57.1%,
                0.997 69.8%,
                1.003 76.9%,
                1
            );
            transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.5s var(--spring-easing);
        }
    }
    .hint--no-shadow:after,
    .hint--no-shadow:before {
        text-shadow: initial;
        box-shadow: initial;
    }
    .hint--no-arrow:before {
        display: none;
    }
`;
