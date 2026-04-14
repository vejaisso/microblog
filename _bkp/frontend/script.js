let token = null;
let currentUser = null;
const API_USER = 'http://localhost:8080/api';
const API_POST = 'http://localhost:8081/api';

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${API_USER}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Credenciais inválidas');
        const data = await res.json();
        token = data.token;
        currentUser = data.user;
        document.getElementById('login-area').style.display = 'none';
        document.getElementById('app-area').style.display = 'block';
        document.getElementById('current-user').innerText = currentUser.username;
        loadPosts();
    } catch (err) {
        document.getElementById('login-error').innerText = err.message;
    }
}
function logout() {
    token = null; currentUser = null;
    document.getElementById('login-area').style.display = 'block';
    document.getElementById('app-area').style.display = 'none';
}
async function loadPosts() {
    try {
        const res = await fetch(`${API_POST}/posts`, { headers: { 'Authorization': `Bearer ${token}` } });
        const posts = await res.json();
        const container = document.getElementById('posts-list');
        container.innerHTML = '';
        for (let post of posts) {
            const div = document.createElement('div');
            div.className = 'post';
            div.innerHTML = `
                <div class="post-meta">Post #${post.id} | Usuário ${post.userId} | ${new Date(post.createdAt).toLocaleString()} | ${post.visible ? '👁️' : '🔒'}</div>
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    ${(currentUser.id === post.userId || currentUser.role === 'ADMIN') ? `<button onclick="editPost(${post.id}, \`${post.content}\`)">Editar</button>` : ''}
                    ${(currentUser.id === post.userId || currentUser.role === 'ADMIN') ? `<button onclick="toggleVisibility(${post.id}, ${!post.visible})">${post.visible ? 'Invisível' : 'Visível'}</button>` : ''}
                    ${currentUser.role === 'ADMIN' ? `<button onclick="deletePost(${post.id})" style="background:#dc3545">Excluir</button>` : ''}
                </div>
            `;
            container.appendChild(div);
        }
    } catch (err) { console.error(err); }
}
async function createPost() {
    const content = document.getElementById('post-content').value;
    if (!content) return;
    await fetch(`${API_POST}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content })
    });
    document.getElementById('post-content').value = '';
    loadPosts();
}
async function editPost(id, oldContent) {
    const newContent = prompt('Editar conteúdo:', oldContent);
    if (!newContent || newContent === oldContent) return;
    await fetch(`${API_POST}/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newContent })
    });
    loadPosts();
}
async function toggleVisibility(id, visible) {
    await fetch(`${API_POST}/posts/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ visible })
    });
    loadPosts();
}
async function deletePost(id) {
    if (!confirm('Excluir permanentemente?')) return;
    await fetch(`${API_POST}/posts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadPosts();
}
