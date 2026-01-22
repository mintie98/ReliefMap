import { ref } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref('info');
let timer = null;

export function useToast() {
    const show = (msg, toastType = 'info', duration = 3000) => {
        message.value = msg;
        type.value = toastType;
        visible.value = true;

        if (timer) clearTimeout(timer);

        if (duration > 0) {
            timer = setTimeout(() => {
                hide();
            }, duration);
        }
    };

    const hide = () => {
        visible.value = false;
    };

    const success = (msg, duration) => show(msg, 'success', duration);
    const error = (msg, duration) => show(msg, 'error', duration);
    const warning = (msg, duration) => show(msg, 'warning', duration);
    const info = (msg, duration) => show(msg, 'info', duration);

    return {
        visible,
        message,
        type,
        show,
        hide,
        success,
        error,
        warning,
        info
    };
}
