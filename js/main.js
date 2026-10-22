const STORAGE_KEY = "subscription-tracker-data";
const form = document.getElementById("subscription-form");
const formMessage = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit");
const formTitle = document.getElementById("form-title");
const formDescription = document.getElementById("form-description");
let subscriptions = loadSubscriptions();
let editingId = null;

function isValidSubscription(subscription) {
    return subscription
        && typeof subscription.id === "string"
        && typeof subscription.name === "string"
        && Number.isFinite(subscription.amount)
        && subscription.amount > 0
        && (subscription.cycle === "monthly" || subscription.cycle === "yearly")
        && typeof subscription.nextPaymentDate === "string"
        && /^\d{4}-\d{2}-\d{2}$/.test(subscription.nextPaymentDate)
        && typeof subscription.category === "string"
        && typeof subscription.paymentMethod === "string";
}

function loadSubscriptions() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === null) {
            return [];
        }

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || !parsed.every(isValidSubscription)) {
            throw new Error("저장된 구독 데이터 형식이 올바르지 않습니다.");
        }
        return parsed;
    } catch (error) {
        showMessage(`저장된 데이터를 불러오지 못했어요: ${error.message}`);
        return [];
    }
}

function saveSubscriptions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
        return true;
    } catch (error) {
        showMessage(`데이터를 저장하지 못했어요: ${error.message}`);
        return false;
    }
}

function showMessage(message, isSuccess) {
    formMessage.textContent = message;
    formMessage.classList.toggle("notice-success", Boolean(isSuccess));
    formMessage.hidden = false;
}

function clearMessage() {
    formMessage.textContent = "";
    formMessage.classList.remove("notice-success");
    formMessage.hidden = true;
}

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function render() {
    const today = getTodayString();
    renderSummary(subscriptions, today);
    renderSubscriptions(subscriptions, today, startEditing, deleteSubscription);
    renderCategories(subscriptions);
}

function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "구독 추가";
    formDescription.textContent = "새로운 구독 정보를 입력해 주세요.";
    submitButton.textContent = "구독 추가하기";
    cancelEditButton.hidden = true;
}

function startEditing(id) {
    const subscription = subscriptions.find((item) => item.id === id);
    if (!subscription) {
        showMessage("수정할 구독을 찾을 수 없어요.");
        return;
    }

    editingId = id;
    for (const [name, value] of Object.entries(subscription)) {
        if (form.elements.namedItem(name)) {
            form.elements.namedItem(name).value = value;
        }
    }
    formTitle.textContent = "구독 수정";
    formDescription.textContent = "변경할 구독 정보를 수정해 주세요.";
    submitButton.textContent = "변경 사항 저장";
    cancelEditButton.hidden = false;
    clearMessage();
    form.elements.namedItem("name").focus();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteSubscription(id) {
    const subscription = subscriptions.find((item) => item.id === id);
    if (!subscription) {
        showMessage("삭제할 구독을 찾을 수 없어요.");
        return;
    }
    if (!window.confirm(`${subscription.name} 구독을 삭제할까요?`)) {
        return;
    }

    const previousSubscriptions = subscriptions;
    subscriptions = subscriptions.filter((item) => item.id !== id);
    if (!saveSubscriptions()) {
        subscriptions = previousSubscriptions;
        return;
    }
    if (editingId === id) {
        resetForm();
    }
    clearMessage();
    render();
}

function createSubscriptionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    if (!form.reportValidity()) {
        return;
    }

    const values = new FormData(form);
    const amount = Number(values.get("amount"));
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        showMessage("금액은 1원 이상의 정수로 입력해 주세요.");
        return;
    }

    const subscription = {
        id: editingId || createSubscriptionId(),
        name: String(values.get("name")).trim(),
        amount,
        cycle: String(values.get("cycle")),
        nextPaymentDate: String(values.get("nextPaymentDate")),
        category: String(values.get("category")).trim(),
        paymentMethod: String(values.get("paymentMethod"))
    };

    if (!subscription.name || !subscription.category) {
        showMessage("구독 이름과 카테고리를 입력해 주세요.");
        return;
    }

    const wasEditing = Boolean(editingId);
    const previousSubscriptions = subscriptions;
    if (editingId) {
        subscriptions = subscriptions.map((item) => item.id === editingId ? subscription : item);
    } else {
        subscriptions = [...subscriptions, subscription];
    }

    if (!saveSubscriptions()) {
        subscriptions = previousSubscriptions;
        return;
    }

    resetForm();
    showMessage(wasEditing ? "구독 정보를 수정했어요." : "새 구독을 추가했어요.", true);
    render();
});

cancelEditButton.addEventListener("click", () => {
    resetForm();
    clearMessage();
});

render();
