const currencyFormatter = new Intl.NumberFormat("ko-KR");

function formatCurrency(amount) {
    return `₩${currencyFormatter.format(amount)}`;
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function renderSummary(subscriptions, today) {
    const monthlyTotal = getTotalMonthlyAmount(subscriptions);
    const yearlyTotal = getTotalYearlyAmount(subscriptions);
    const upcoming = getUpcomingPayments(subscriptions, today, 7);
    const upcomingTotal = upcoming.reduce((total, subscription) => total + subscription.amount, 0);

    document.getElementById("monthly-total").textContent = formatCurrency(monthlyTotal);
    document.getElementById("yearly-total").textContent = formatCurrency(yearlyTotal);
    document.getElementById("upcoming-total").textContent = formatCurrency(upcomingTotal);
    document.getElementById("upcoming-count").textContent = upcoming.length
        ? `${upcoming.length}건의 결제가 7일 이내에 예정돼요`
        : "예정된 구독이 없어요";
    document.getElementById("subscription-count").textContent = `${subscriptions.length}개`;
}

function renderSubscriptions(subscriptions, today, onEdit, onDelete) {
    const list = document.getElementById("subscription-list");
    list.replaceChildren();

    if (subscriptions.length === 0) {
        list.append(createElement("div", "empty-state", "아직 등록된 구독이 없어요.\n오른쪽 폼에서 첫 구독을 추가해 보세요."));
        return;
    }

    const sortedSubscriptions = [...subscriptions].sort((first, second) =>
        first.nextPaymentDate.localeCompare(second.nextPaymentDate)
    );

    for (const subscription of sortedSubscriptions) {
        const card = createElement("article", "subscription-card");
        const main = createElement("div", "subscription-main");
        const titleRow = createElement("div", "subscription-title-row");
        const title = createElement("h3", "subscription-name", subscription.name);
        const category = createElement("span", "category-tag", subscription.category);
        titleRow.append(title, category);

        const meta = createElement("div", "subscription-meta");
        const cycle = subscription.cycle === "yearly" ? "연간 결제" : "월간 결제";
        const payment = createElement("span", "", `${cycle} · ${subscription.paymentMethod}`);
        const days = getDaysUntilNextPayment(today, subscription.nextPaymentDate);
        let dayLabel = `D-${days}`;
        if (days === 0) {
            dayLabel = "오늘 결제";
        } else if (days < 0) {
            dayLabel = `결제일 지남 · ${Math.abs(days)}일`;
        }
        const paymentDay = createElement("span", "payment-day", dayLabel);
        meta.append(payment, paymentDay);
        main.append(titleRow, meta);

        const side = createElement("div", "subscription-side");
        const amount = createElement("p", "subscription-amount", formatCurrency(getMonthlyAmount(subscription)));
        const actions = createElement("div", "subscription-actions");
        const editButton = createElement("button", "text-button", "수정");
        editButton.type = "button";
        editButton.setAttribute("aria-label", `${subscription.name} 수정`);
        editButton.addEventListener("click", () => onEdit(subscription.id));

        const deleteButton = createElement("button", "text-button text-button-danger", "삭제");
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `${subscription.name} 삭제`);
        deleteButton.addEventListener("click", () => onDelete(subscription.id));
        actions.append(editButton, deleteButton);
        side.append(amount, actions);
        card.append(main, side);
        list.append(card);
    }
}

function renderCategories(subscriptions) {
    const list = document.getElementById("category-list");
    list.replaceChildren();

    if (subscriptions.length === 0) {
        list.append(createElement("p", "category-empty", "구독을 추가하면 비중을 볼 수 있어요."));
        return;
    }

    const totals = getMonthlyAmountByCategory(subscriptions);
    const total = getTotalMonthlyAmount(subscriptions);
    const entries = Object.entries(totals).sort((first, second) => second[1] - first[1]);

    for (const [name, amount] of entries) {
        const row = createElement("div", "category-row");
        const labelRow = createElement("div", "category-label-row");
        const categoryName = createElement("span", "category-name", name);
        const share = total === 0 ? 0 : Math.round((amount / total) * 100);
        const categoryShare = createElement("span", "category-share", `${formatCurrency(amount)} · ${share}%`);
        labelRow.append(categoryName, categoryShare);

        const track = createElement("div", "progress-track");
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", `${name} 카테고리 비중`);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-valuenow", String(share));
        const fill = createElement("div", "progress-fill");
        fill.style.width = `${share}%`;
        track.append(fill);
        row.append(labelRow, track);
        list.append(row);
    }
}
