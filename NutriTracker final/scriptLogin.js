function openLoginPopup() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';
    document.getElementById('popup-content').innerHTML = `
        <h2>Login</h2>
        <form>
            <input type="text" placeholder="Username">
            <input type="password" placeholder="Password">
            <button type="submit">Login</button>
        </form>
    `;
}

function openSignUpPopup() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';
    document.getElementById('popup-content').innerHTML = `
        <h2>Sign Up</h2>
        <form>
            <input type="text" placeholder="Username">
            <input type="password" placeholder="Password">
            <input type="email" placeholder="Email">
            <button type="submit">Sign Up</button>
        </form>
    `;
}

function closePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popup').style.display = 'none';
}
