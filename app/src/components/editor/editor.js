import "../../helpers/iframeLoader.js";

import axios from "axios";
import React, {Component} from "react";
import UIkit from "uikit";

import DOMHelper from "../../helpers/dom-helper.js";
import EditorText from "../editor-text"
import Spinner from "../spinner";

export default class Editor extends Component {
    constructor() {
        super();

        this.currentPage = "index.html";
        this.state = {
            pageList: [],
            newPageName: "",
            loading: true
        }
        this.createNewPage = this.createNewPage.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.isLoaded = this.isLoaded.bind(this);
    }

    componentDidMount() {
        this.init(this.currentPage);
    }

    init(page) {
        this.iframe = document.querySelector('iframe');
        this.open(page, this.isLoaded);
        this.loadPageList();
    }

    open(page, callback) {
        this.currentPage = page;

        axios
            .get(`../${page}?rnd=${Math.random()}`)
            .then(res => DOMHelper.parseStrToDom(res.data))
            .then(DOMHelper.wrapTextNodes)
            .then(dom => {
                this.virtualDom = dom;
                return dom;
            })
            .then(DOMHelper.serializeDomToString)
            .then(html => axios.post("./api/saveTempPage.php", {html}))
            .then(() => this.iframe.load("../temp.html"))
            .then(() => this.enableEditing())
            .then(() => this.injectStyles())
            .then(callback)
    }

    enableEditing() {
        this.iframe.contentDocument.body.querySelectorAll("text-editor").forEach(element => {
            const id = element.getAttribute("nodeid");
            const virtualElement = this.virtualDom.body.querySelector(`[nodeid="${id}"]`);

            new EditorText(element, virtualElement);
        });
    }

    injectStyles() {
        const style = this.iframe.contentDocument.createElement("style");
        style.innerHTML = `
            text-editor:hover {
                outline: 3px solid orange;
                outline-offset: 8px;
            }
            text-editor:focus {
                outline: 3px solid red;
                outline-offset: 8px;
            }
        `;
        this.iframe.contentDocument.head.appendChild(style);
    }

    save(onSuccess, onError) {
        this.isLoading();
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        const html = DOMHelper.serializeDomToString(newDom);

        axios
            .post("./api/savePage.php", {pageName: this.currentPage, html})
            .then(onSuccess)
            .catch(onError)
            .finally(this.isLoaded);
    }

    loadPageList() {
        axios
            .get("./api")
            .then(res => this.setState({pageList: res.data}));
    }

    createNewPage() {
        axios
            .post("./api/createNewPage.php", {"name": this.state.newPageName})
            .then(this.loadPageList())
            .catch(() => alert("Страница уже существует!"));
    }

    deletePage(page) {
        axios
            .post('./api/deletePage.php', {"name": page})
            .then(this.loadPageList())
            .catch(() => alert("Страница не существует!"));
    }

    isLoading() {
        this.setState({
            loading: true
        })
    }

    isLoaded() {
        this.setState({
            loading: false
        })
    }

    render() {
        const {loading} = this.state;
        const modal = true;
        let spinner;

        loading ? spinner = <Spinner active/> : spinner = <Spinner />

        return (
            <>
                <iframe src={this.currentPage} frameBorder="0"></iframe>
                
                {spinner}

                <div className="panel">
                    <button className="uk-button uk-button-primary" uk-toggle="target: #modal-save">Опубликовать</button>

                </div>
                {/* <button onClick={() => this.save()}>Save</button> */}

                <div id="modal-save" uk-modal={modal.toString()}>
                    <div className="uk-modal-dialog uk-modal-body">
                        <h2 className="uk-modal-title">Сохранение</h2>
                        <p>Вы действительно хотите сохранить изменения?</p>
                        <p className="uk-text-right">
                            <button 
                                className="uk-button uk-button-default uk-modal-close uk-modal-close"
                                type="button">Отменить</button>
                            <button
                                className="uk-button uk-button-primary uk-modal-close"
                                type="button"
                                onClick={() => this.save(() => {
                                    UIkit.notification({message: 'Успешно сохранено', status: 'success'})
                                },
                                () => {
                                    UIkit.notification({message: 'Ошибка сохранения', status: 'danger'})
                                })}>Опубликовать</button>
                        </p>
                    </div>
                </div>
            </>
        )
    }
}