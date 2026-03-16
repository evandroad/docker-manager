let groupState = JSON.parse(localStorage.getItem("groupState") || "{}")
console.log(groupState)

window.onload = () => {
	let page = localStorage.getItem("activePage") || "containers"
	openPage(page)
}

const pages = {
	containers: loadContainers,
	images: loadImages,
	volumes: loadVolumes,
	networks: loadNetworks
}

function openPage(page){
	localStorage.setItem("activePage", page)
	setActiveNav(page)
	pages[page]()
}

function setActiveNav(page) {
	document.querySelectorAll(".link-nav").forEach(btn => {
		btn.classList.remove("active")

		if(btn.dataset.page === page){
			btn.classList.add("active")
		}
	})
}

function renderTable(containers) {
	let groups = groupByProject(containers)

	Object.keys(groupState).forEach(k => {
		if (!groups[k]) {
			delete groupState[k]
		}
	})

	let html = `
		<tr>
			<th></th>
			<th>ID</th>
			<th>Name</th>
			<th>Image</th>
			<th>Status</th>
			<th>Actions</th>
		</tr>
	`

	for (let project of Object.keys(groups).sort()) {
		let list = groups[project]
		let key = project.replace(/[^a-zA-Z0-9]/g,"")
		let open = groupState[key]
		let display = open ? "" : "none"
		let arrow = open ? "▼" : "▶"

		html += `
			<tr class="group-header">
				<td colspan="6">
					<span class="toggle" onclick="toggleGroup('${key}')" style="cursor: pointer">
						<span id="arrow-${key}">${arrow}</span>
						<b>${project}</b> (${list.length})
					</span>
				</td>
			</tr>
		`

		list.forEach(c => {
			html += `
			<tr class="group-${key}" style="display:${display}">
				<td>${statusDot(c.State)}</td>
				<td>${c.ID}</td>
				<td>${c.Name.replace("/", "")}</td>
				<td>${c.Image}</td>
				<td title="${c.Status}">${c.State}</td>
				<td>${actionButtons(c)}</td>
			</tr>
			`
		})
	}

	document.getElementById("table").innerHTML = html
}

function toggleGroup(project) {
	let rows = document.querySelectorAll(".group-"+project)
	let arrow = document.getElementById("arrow-"+project)

	let hidden = rows[0].style.display === "none"

	rows.forEach(r=>{
		r.style.display = hidden ? "" : "none"
	})

	arrow.textContent = hidden ? "▼" : "▶"

	groupState[project] = hidden

	localStorage.setItem("groupState", JSON.stringify(groupState))
}

function getStatusInfo(status) {
	if (status.startsWith("Up")) {
		return { color: "green", label: "running" }
	}

	if (status.startsWith("Exited")) {
		return { color: "red", label: "stopped" }
	}

	if (status.startsWith("Created")) {
		return { color: "gray", label: "created" }
	}

	return { color: "orange", label: "unknown" }
}

function groupByProject(containers) {
	let groups = {}

	containers.forEach(c=>{
		let key = c.Project || "standalone"

		if(!groups[key]){
			groups[key] = []
		}

		groups[key].push(c)
	})

	return groups
}

async function loadContainers() {
	let data = await containers()
	renderTable(data)
}

async function start(event, id) {
	event.stopPropagation()
	startContainer(id)
	loadContainers()
}

async function stop(event, id) {
	event.stopPropagation()
	if (!confirm("Stop container?")) return
	stopContainer(id)
	setTimeout(loadContainers, 3000)
}

function statusDot(state) {
	let color = "gray"

	if (state === "running") color = "green"
	if (state === "exited") color = "red"

	return `<span class="status-dot" style="background:${color}"></span>`
}

function actionButtons(c) {
	if(c.State === "running"){
		return `<button onclick="stop(event, '${c.ID}')">Stop</button>`
	}

	return `<button onclick="start(event, '${c.ID}')">Start</button>`
}

async function loadImages() {
	let data = await images()
	renderTable(data)
}

async function loadVolumes() {
	let data = await volumes()
	renderTable(data)
}

async function loadNetworks() {
	let data = await networks()
	renderTable(data)
}
