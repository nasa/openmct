var Painterro = function(t) {
    function e(i) {
        if (A[i])
            return A[i].exports;
        var o = A[i] = {
            i: i,
            l: !1,
            exports: {}
        };
        return t[i].call(o.exports, o, o.exports, e),
            o.l = !0,
            o.exports
    }
    var A = {};
    return e.m = t,
        e.c = A,
        e.i = function(t) {
            return t
        },
        e.d = function(t, A, i) {
            e.o(t, A) || Object.defineProperty(t, A, {
                configurable: !1,
                enumerable: !0,
                get: i
            })
        },
        e.n = function(t) {
            var A = t && t.__esModule ? function() {
                    return t.default
                } :
                function() {
                    return t
                };
            return e.d(A, "a", A),
                A
        },
        e.o = function(t, e) {
            return Object.prototype.hasOwnProperty.call(t, e)
        },
        e.p = "",
        e(e.s = 18)
}([function(t, e, A) {
    "use strict";

    function i() {
        for (var t = "ptro", e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", A = 0; A < 8; A += 1)
            t += e.charAt(Math.floor(Math.random() * e.length));
        return t
    }

    function o() {
        "documentOffsetTop" in Element.prototype || Object.defineProperty(Element.prototype, "documentOffsetTop", {
                get: function() {
                    return this.getBoundingClientRect().top
                }
            }),
            "documentOffsetLeft" in Element.prototype || Object.defineProperty(Element.prototype, "documentOffsetLeft", {
                get: function() {
                    return this.getBoundingClientRect().left
                }
            }),
            "documentClientWidth" in Element.prototype || Object.defineProperty(Element.prototype, "documentClientWidth", {
                get: function() {
                    var t = this.getBoundingClientRect();
                    return t.width ? t.width : t.right - t.left
                }
            }),
            "documentClientHeight" in Element.prototype || Object.defineProperty(Element.prototype, "documentClientHeight", {
                get: function() {
                    var t = this.getBoundingClientRect();
                    return t.height ? t.height : t.bottom - t.top
                }
            })
    }

    function r() {
        var t = null;
        window.getSelection ? t = window.getSelection() : document.selection && (t = document.selection),
            t && (t.empty && t.empty(),
                t.removeAllRanges && t.removeAllRanges())
    }

    function a(t, e) {
        var A = t.x - e.x,
            i = t.y - e.y;
        return Math.sqrt(A * A + i * i)
    }

    function n(t) {
        return String(t).replace(/^\s+|\s+$/g, "")
    }

    function l(t) {
        if (window.clipboardData && window.clipboardData.setData)
            window.clipboardData.setData("Text", t);
        else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var e = document.createElement("textarea");
            e.textContent = t,
                e.style.position = "fixed",
                document.body.appendChild(e),
                e.select();
            try {
                document.execCommand("copy")
            } catch (t) {
                console.warn("Copy to clipboard failed.", t)
            } finally {
                document.body.removeChild(e)
            }
        }
    }

    function s() {
        var t = !1,
            e = navigator.userAgent || navigator.vendor || window.opera;
        return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(e) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(e.substr(0, 4))) && (t = !0),
            t
    }

    function c() {
        var t = document.createElement("div");
        t.style.visibility = "hidden",
            t.style.width = "100px",
            t.style.msOverflowStyle = "scrollbar",
            document.body.appendChild(t);
        var e = t.offsetWidth;
        t.style.overflow = "scroll";
        var A = document.createElement("div");
        A.style.width = "100%",
            t.appendChild(A);
        var i = A.offsetWidth;
        return t.parentNode.removeChild(t),
            e - i
    }

    function g(t, e) {
        var A = new XMLHttpRequest;
        A.onload = function() {
                var t = new FileReader;
                t.onloadend = function() {
                        e(t.result)
                    },
                    t.readAsDataURL(A.response)
            },
            A.open("GET", t),
            A.responseType = "blob",
            A.send()
    }

    function h(t) {
        console.error("[Painterro] " + t)
    }

    function u(t, e) {
        return -1 !== e.indexOf(t)
    }
    Object.defineProperty(e, "__esModule", {
            value: !0
        }),
        e.genId = i,
        e.addDocumentObjectHelpers = o,
        e.clearSelection = r,
        e.distance = a,
        e.trim = n,
        e.copyToClipboard = l,
        e.isMobileOrTablet = s,
        e.getScrollbarWidth = c,
        e.imgToDataURL = g,
        e.logError = h,
        e.checkIn = u;
    e.KEYS = {
        y: 89,
        z: 90,
        s: 83,
        c: 67,
        x: 88,
        a: 65,
        enter: 13,
        esc: 27,
        del: 46
    }
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }

    function o(t) {
        return n.get().tr(t)
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var r = function() {
        function t(t, e) {
            for (var A = 0; A < e.length; A++) {
                var i = e[A];
                i.enumerable = i.enumerable || !1,
                    i.configurable = !0,
                    "value" in i && (i.writable = !0),
                    Object.defineProperty(t, i.key, i)
            }
        }
        return function(e, A, i) {
            return A && t(e.prototype, A),
                i && t(e, i),
                e
        }
    }();
    e.tr = o;
    var a = null,
        n = function() {
            function t() {
                i(this, t),
                    this.translations = {
                        en: {
                            lineColor: "L",
                            lineColorFull: "Line color",
                            fillColor: "F",
                            fillColorFull: "Fill color",
                            alpha: "A",
                            alphaFull: "Alpha",
                            lineWidth: "W",
                            lineWidthFull: "Line width",
                            eraserWidth: "E",
                            eraserWidthFull: "Eraser width",
                            textColor: "C",
                            textColorFull: "Text color",
                            fontSize: "S",
                            fontSizeFull: "Font Size",
                            fontStrokeSize: "St",
                            fontStrokeSizeFull: "Stroke width",
                            fontStyle: "FS",
                            fontStyleFull: "Font Style",
                            fontName: "F",
                            fontNameFull: "Font name",
                            textStrokeColor: "SC",
                            textStrokeColorFull: "Stroke color",
                            apply: "Apply",
                            cancel: "Cancel",
                            close: "Close",
                            clear: "Clear",
                            width: "Width",
                            height: "Height",
                            keepRatio: "Keep width/height ratio",
                            fillPageWith: "Fill page with current backgroud color",
                            pixelSize: "P",
                            pixelSizeFull: "Pixel Size",
                            resizeScale: "Scale",
                            resizeResize: "Resize",
                            backgroundColor: "Page background color",
                            pixelizePixelSize: "Pixelize pixel size",
                            wrongPixelSizeValue: 'Wrong pixel size. You can enter e.g. "20%" which mean pixel size will be 1/5 of the selected area side, or "4" means 4 px',
                            tools: {
                                crop: "Crop image to selected area",
                                pixelize: "Pixelize selected area",
                                rect: "Draw rectangle",
                                ellipse: "Draw ellipse",
                                line: "Draw line",
                                rotate: "Rotate image",
                                save: "Save Image",
                                load: "Load image",
                                text: "Put text",
                                brush: "Brush",
                                resize: "Resize or scale",
                                open: "Open image",
                                select: "Select area",
                                close: "Close Painterro",
                                eraser: "Eraser",
                                settings: "Settings"
                            },
                            pasteOptions: {
                                fit: "Replace all",
                                extend_down: "Extend down",
                                extend_right: "Extend right",
                                over: "Paste over",
                                how_to_paste: "How to paste?"
                            }
                        }
                    },
                    this.activate("en"),
                    this.defaultTranslator = this.translations.en
            }
            return r(t, [{
                    key: "addTranslation",
                    value: function(t, e) {
                        this.translations[t] = e
                    }
                }, {
                    key: "activate",
                    value: function(t) {
                        void 0 !== this.translations[t] ? (this.trans = t,
                            this.translator = this.translations[this.trans]) : this.translator = this.defaultTranslator
                    }
                }, {
                    key: "tr",
                    value: function(t) {
                        var e = t.split("."),
                            A = this.translator,
                            i = this.defaultTranslator;
                        return e.forEach(function(t) {
                                i = i[t],
                                    void 0 !== A && (A = A[t])
                            }),
                            A || i
                    }
                }], [{
                    key: "get",
                    value: function() {
                        return a || (a = new t)
                    }
                }]),
                t
        }();
    e.default = n
}, function(t, e) {
    t.exports = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMTAwIgogICBoZWlnaHQ9IjEwMCIKICAgdmlld0JveD0iMCAwIDEwMCAxMDAiCiAgIGlkPSJzdmcyIgogICB2ZXJzaW9uPSIxLjEiCiAgIGlua3NjYXBlOnZlcnNpb249IjAuOTEgcjEzNzI1IgogICBzb2RpcG9kaTpkb2NuYW1lPSJjaGVja2Vycy5zdmciPgogIDxkZWZzCiAgICAgaWQ9ImRlZnM0IiAvPgogIDxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBpZD0iYmFzZSIKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgYm9yZGVyb3BhY2l0eT0iMS4wIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp6b29tPSIyLjgyODQyNzIiCiAgICAgaW5rc2NhcGU6Y3g9IjY1LjY1ODAyNyIKICAgICBpbmtzY2FwZTpjeT0iODAuMDM2NTc3IgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgc2hvd2dyaWQ9InRydWUiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwMTciCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGJvcmRlcmxheWVyPSJ0cnVlIgogICAgIHdpZHRoPSIxMG1tIgogICAgIHVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpzbmFwLWJib3g9InRydWUiCiAgICAgaW5rc2NhcGU6YmJveC1ub2Rlcz0idHJ1ZSI+CiAgICA8aW5rc2NhcGU6Z3JpZAogICAgICAgdHlwZT0ieHlncmlkIgogICAgICAgaWQ9ImdyaWQ0MTM2IgogICAgICAgc3BhY2luZ3g9IjQuOTk5OTk5OSIKICAgICAgIHNwYWNpbmd5PSI0Ljk5OTk5OTkiCiAgICAgICBlbXBzcGFjaW5nPSI1IgogICAgICAgb3JpZ2lueD0iMCIKICAgICAgIG9yaWdpbnk9IjAiIC8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNyI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGUgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICBpbmtzY2FwZTpsYWJlbD0iTGF5ZXIgMSIKICAgICBpbmtzY2FwZTpncm91cG1vZGU9ImxheWVyIgogICAgIGlkPSJsYXllcjEiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwtOTUyLjM2MjE3KSI+CiAgICA8cmVjdAogICAgICAgc3R5bGU9ImZpbGw6IzQ2NDY0NjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4xO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICBpZD0icmVjdDQxNDMiCiAgICAgICB3aWR0aD0iNTAiCiAgICAgICBoZWlnaHQ9IjQ5Ljk5OTk4OSIKICAgICAgIHg9IjAiCiAgICAgICB5PSI5NTIuMzYyMTgiIC8+CiAgICA8cmVjdAogICAgICAgc3R5bGU9ImZpbGw6IzQ2NDY0NjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4xO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICBpZD0icmVjdDQxNDMtOSIKICAgICAgIHdpZHRoPSI1MCIKICAgICAgIGhlaWdodD0iNDkuOTk5OTg5IgogICAgICAgeD0iNTAiCiAgICAgICB5PSIxMDAyLjM2MjIiIC8+CiAgPC9nPgo8L3N2Zz4K"
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        var A = t[1] || "",
            i = t[3];
        if (!i)
            return A;
        if (e && "function" == typeof btoa) {
            var r = o(i);
            return [A].concat(i.sources.map(function(t) {
                return "/*# sourceURL=" + i.sourceRoot + t + " */"
            })).concat([r]).join("\n")
        }
        return [A].join("\n")
    }

    function o(t) {
        return "/*# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(t)))) + " */"
    }
    t.exports = function(t) {
        var e = [];
        return e.toString = function() {
                return this.map(function(e) {
                    var A = i(e, t);
                    return e[2] ? "@media " + e[2] + "{" + A + "}" : A
                }).join("")
            },
            e.i = function(t, A) {
                "string" == typeof t && (t = [
                    [null, t, ""]
                ]);
                for (var i = {}, o = 0; o < this.length; o++) {
                    var r = this[o][0];
                    "number" == typeof r && (i[r] = !0)
                }
                for (o = 0; o < t.length; o++) {
                    var a = t[o];
                    "number" == typeof a[0] && i[a[0]] || (A && !a[2] ? a[2] = A : A && (a[2] = "(" + a[2] + ") and (" + A + ")"),
                        e.push(a))
                }
            },
            e
    }
}, function(t, e, A) {
    function i(t, e) {
        for (var A = 0; A < t.length; A++) {
            var i = t[A],
                o = M[i.id];
            if (o) {
                o.refs++;
                for (var r = 0; r < o.parts.length; r++)
                    o.parts[r](i.parts[r]);
                for (; r < i.parts.length; r++)
                    o.parts.push(c(i.parts[r], e))
            } else {
                for (var a = [], r = 0; r < i.parts.length; r++)
                    a.push(c(i.parts[r], e));
                M[i.id] = {
                    id: i.id,
                    refs: 1,
                    parts: a
                }
            }
        }
    }

    function o(t, e) {
        for (var A = [], i = {}, o = 0; o < t.length; o++) {
            var r = t[o],
                a = e.base ? r[0] + e.base : r[0],
                n = r[1],
                l = r[2],
                s = r[3],
                c = {
                    css: n,
                    media: l,
                    sourceMap: s
                };
            i[a] ? i[a].parts.push(c) : A.push(i[a] = {
                id: a,
                parts: [c]
            })
        }
        return A
    }

    function r(t, e) {
        var A = d(t.insertInto);
        if (!A)
            throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
        var i = T[T.length - 1];
        if ("top" === t.insertAt)
            i ? i.nextSibling ? A.insertBefore(e, i.nextSibling) : A.appendChild(e) : A.insertBefore(e, A.firstChild),
            T.push(e);
        else {
            if ("bottom" !== t.insertAt)
                throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
            A.appendChild(e)
        }
    }

    function a(t) {
        t.parentNode.removeChild(t);
        var e = T.indexOf(t);
        e >= 0 && T.splice(e, 1)
    }

    function n(t) {
        var e = document.createElement("style");
        return t.attrs.type = "text/css",
            s(e, t.attrs),
            r(t, e),
            e
    }

    function l(t) {
        var e = document.createElement("link");
        return t.attrs.type = "text/css",
            t.attrs.rel = "stylesheet",
            s(e, t.attrs),
            r(t, e),
            e
    }

    function s(t, e) {
        Object.keys(e).forEach(function(A) {
            t.setAttribute(A, e[A])
        })
    }

    function c(t, e) {
        var A, i, o, r;
        if (e.transform && t.css) {
            if (!(r = e.transform(t.css)))
                return function() {};
            t.css = r
        }
        if (e.singleton) {
            var s = D++;
            A = N || (N = n(e)),
                i = g.bind(null, A, s, !1),
                o = g.bind(null, A, s, !0)
        } else
            t.sourceMap && "function" == typeof URL && "function" == typeof URL.createObjectURL && "function" == typeof URL.revokeObjectURL && "function" == typeof Blob && "function" == typeof btoa ? (A = l(e),
                i = u.bind(null, A, e),
                o = function() {
                    a(A),
                        A.href && URL.revokeObjectURL(A.href)
                }
            ) : (A = n(e),
                i = h.bind(null, A),
                o = function() {
                    a(A)
                }
            );
        return i(t),
            function(e) {
                if (e) {
                    if (e.css === t.css && e.media === t.media && e.sourceMap === t.sourceMap)
                        return;
                    i(t = e)
                } else
                    o()
            }
    }

    function g(t, e, A, i) {
        var o = A ? "" : i.css;
        if (t.styleSheet)
            t.styleSheet.cssText = w(e, o);
        else {
            var r = document.createTextNode(o),
                a = t.childNodes;
            a[e] && t.removeChild(a[e]),
                a.length ? t.insertBefore(r, a[e]) : t.appendChild(r)
        }
    }

    function h(t, e) {
        var A = e.css,
            i = e.media;
        if (i && t.setAttribute("media", i),
            t.styleSheet)
            t.styleSheet.cssText = A;
        else {
            for (; t.firstChild;)
                t.removeChild(t.firstChild);
            t.appendChild(document.createTextNode(A))
        }
    }

    function u(t, e, A) {
        var i = A.css,
            o = A.sourceMap,
            r = void 0 === e.convertToAbsoluteUrls && o;
        (e.convertToAbsoluteUrls || r) && (i = I(i)),
        o && (i += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(o)))) + " */");
        var a = new Blob([i], {
                type: "text/css"
            }),
            n = t.href;
        t.href = URL.createObjectURL(a),
            n && URL.revokeObjectURL(n)
    }
    var M = {},
        p = function(t) {
            var e;
            return function() {
                return void 0 === e && (e = t.apply(this, arguments)),
                    e
            }
        }(function() {
            return window && document && document.all && !window.atob
        }),
        d = function(t) {
            var e = {};
            return function(A) {
                return void 0 === e[A] && (e[A] = t.call(this, A)),
                    e[A]
            }
        }(function(t) {
            return document.querySelector(t)
        }),
        N = null,
        D = 0,
        T = [],
        I = A(19);
    t.exports = function(t, e) {
        if ("undefined" != typeof DEBUG && DEBUG && "object" != typeof document)
            throw new Error("The style-loader cannot be used in a non-browser environment");
        e = e || {},
            e.attrs = "object" == typeof e.attrs ? e.attrs : {},
            e.singleton || (e.singleton = p()),
            e.insertInto || (e.insertInto = "head"),
            e.insertAt || (e.insertAt = "bottom");
        var A = o(t, e);
        return i(A, e),
            function(t) {
                for (var r = [], a = 0; a < A.length; a++) {
                    var n = A[a],
                        l = M[n.id];
                    l.refs--,
                        r.push(l)
                }
                if (t) {
                    i(o(t, e), e)
                }
                for (var a = 0; a < r.length; a++) {
                    var l = r[a];
                    if (0 === l.refs) {
                        for (var s = 0; s < l.parts.length; s++)
                            l.parts[s]();
                        delete M[l.id]
                    }
                }
            }
    };
    var w = function() {
        var t = [];
        return function(e, A) {
            return t[e] = A,
                t.filter(Boolean).join("\n")
        }
    }()
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }

    function o(t) {
        var e = /^#?([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})$/i.exec(t);
        return e ? {
            r: parseInt(e[1], 16),
            g: parseInt(e[2], 16),
            b: parseInt(e[3], 16)
        } : (e = /^#?([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])$/i.exec(t),
            e ? {
                r: parseInt(e[1].repeat(2), 16),
                g: parseInt(e[2].repeat(2), 16),
                b: parseInt(e[3].repeat(2), 16)
            } : void 0)
    }

    function r(t, e) {
        var A = o(t);
        return "rgba(" + A.r + "," + A.g + "," + A.b + "," + e + ")"
    }

    function a(t) {
        var e = t.toString(16);
        return 1 === e.length && "0" + e || e
    }

    function n(t, e, A) {
        return "#" + a(t) + a(e) + a(A)
    }

    function l(t) {
        var e = o(t);
        return (299 * e.r + 587 * e.g + 114 * e.b) / 1e3 >= 128 && "black" || "white"
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var s = function() {
        function t(t, e) {
            for (var A = 0; A < e.length; A++) {
                var i = e[A];
                i.enumerable = i.enumerable || !1,
                    i.configurable = !0,
                    "value" in i && (i.writable = !0),
                    Object.defineProperty(t, i.key, i)
            }
        }
        return function(e, A, i) {
            return A && t(e.prototype, A),
                i && t(e, i),
                e
        }
    }();
    e.HexToRGBA = r;
    var c = A(1),
        g = A(0),
        h = function() {
            function t(e, A) {
                var o = this;
                i(this, t),
                    this.callback = A,
                    this.main = e,
                    this.w = 180,
                    this.h = 150;
                var r = this.w,
                    a = this.h;
                this.lightPosition = this.w - 1,
                    this.wrapper = e.wrapper.querySelector(".ptro-color-widget-wrapper"),
                    this.input = e.wrapper.querySelector(".ptro-color-widget-wrapper .ptro-color"),
                    this.pipetteButton = e.wrapper.querySelector(".ptro-color-widget-wrapper button.ptro-pipette"),
                    this.closeButton = e.wrapper.querySelector(".ptro-color-widget-wrapper button.ptro-close-color-picker"),
                    this.canvas = e.wrapper.querySelector(".ptro-color-widget-wrapper canvas"),
                    this.ctx = this.canvas.getContext("2d"),
                    this.canvasLight = e.wrapper.querySelector(".ptro-color-widget-wrapper .ptro-canvas-light"),
                    this.colorRegulator = e.wrapper.querySelector(".ptro-color-widget-wrapper .ptro-color-light-regulator"),
                    this.canvasAlpha = e.wrapper.querySelector(".ptro-color-widget-wrapper .ptro-canvas-alpha"),
                    this.alphaRegulator = e.wrapper.querySelector(".ptro-color-widget-wrapper .ptro-color-alpha-regulator"),
                    this.ctxLight = this.canvasLight.getContext("2d"),
                    this.ctxAlpha = this.canvasAlpha.getContext("2d"),
                    this.canvas.setAttribute("width", "" + r),
                    this.canvas.setAttribute("height", "" + a),
                    this.canvasLight.setAttribute("width", "" + r),
                    this.canvasLight.setAttribute("height", "20"),
                    this.canvasAlpha.setAttribute("width", "" + r),
                    this.canvasAlpha.setAttribute("height", "20");
                var n = this.ctx.createLinearGradient(0, 0, r, 0);
                n.addColorStop(1 / 15, "#ff0000"),
                    n.addColorStop(4 / 15, "#ffff00"),
                    n.addColorStop(5 / 15, "#00ff00"),
                    n.addColorStop(.6, "#00ffff"),
                    n.addColorStop(.8, "#0000ff"),
                    n.addColorStop(14 / 15, "#ff00ff"),
                    this.ctx.fillStyle = n,
                    this.ctx.fillRect(0, 0, r, a);
                var l = this.ctx.createLinearGradient(0, 0, 0, a);
                l.addColorStop(0, "rgba(0, 0, 0, 0)"),
                    l.addColorStop(.99, "rgba(0, 0, 0, 1)"),
                    l.addColorStop(1, "rgba(0, 0, 0, 1)"),
                    this.ctx.fillStyle = l,
                    this.ctx.fillRect(0, 0, r, a),
                    this.closeButton.onclick = function() {
                        o.close()
                    },
                    this.pipetteButton.onclick = function() {
                        o.wrapper.setAttribute("hidden", "true"),
                            o.opened = !1,
                            o.choosing = !0
                    },
                    this.input.onkeyup = function() {
                        o.setActiveColor(o.input.value, !0)
                    }
            }
            return s(t, [{
                    key: "open",
                    value: function(t, e) {
                        this.target = t.target,
                            this.palleteColor = t.palleteColor,
                            this.alpha = t.alpha,
                            this.lightPosition = this.lightPosition || this.w - 1,
                            this.drawLighter(),
                            this.colorRegulator.style.left = this.lightPosition + "px",
                            this.alphaRegulator.style.left = Math.round(this.alpha * this.w) + "px",
                            this.regetColor(),
                            this.wrapper.removeAttribute("hidden"),
                            this.opened = !0,
                            this.addCallback = e
                    }
                }, {
                    key: "close",
                    value: function() {
                        this.wrapper.setAttribute("hidden", "true"),
                            this.opened = !1
                    }
                }, {
                    key: "getPaletteColorAtPoint",
                    value: function(t) {
                        var e = t.clientX - this.canvas.documentOffsetLeft,
                            A = t.clientY - this.canvas.documentOffsetTop;
                        e = e < 1 && 1 || e,
                            A = A < 1 && 1 || A,
                            e = e > this.w && this.w - 1 || e,
                            A = A > this.h && this.h - 1 || A;
                        var i = this.ctx.getImageData(e, A, 1, 1).data;
                        this.palleteColor = n(i[0], i[1], i[2]),
                            this.drawLighter(),
                            this.regetColor()
                    }
                }, {
                    key: "regetColor",
                    value: function() {
                        var t = this.ctxLight.getImageData(this.lightPosition, 5, 1, 1).data;
                        this.setActiveColor(n(t[0], t[1], t[2])),
                            this.drawAlpher()
                    }
                }, {
                    key: "regetAlpha",
                    value: function() {
                        var t = this.ctxAlpha.getImageData(this.alphaPosition, 5, 1, 1).data;
                        this.alpha = t[3] / 255,
                            this.setActiveColor(this.color, !0)
                    }
                }, {
                    key: "getColorLightAtClick",
                    value: function(t) {
                        var e = t.clientX - this.canvasLight.documentOffsetLeft;
                        e = e < 1 && 1 || e,
                            e = e > this.w - 1 && this.w - 1 || e,
                            this.lightPosition = e,
                            this.colorRegulator.style.left = e + "px",
                            this.regetColor()
                    }
                }, {
                    key: "getAlphaAtClick",
                    value: function(t) {
                        var e = t.clientX - this.canvasAlpha.documentOffsetLeft;
                        e = e < 1 && 1 || e,
                            e = e > this.w - 1 && this.w - 1 || e,
                            this.alphaPosition = e,
                            this.alphaRegulator.style.left = e + "px",
                            this.regetAlpha()
                    }
                }, {
                    key: "handleKeyDown",
                    value: function(t) {
                        t.keyCode === g.KEYS.esc && this.close()
                    }
                }, {
                    key: "handleMouseDown",
                    value: function(t) {
                        return this.choosing && 2 !== t.button ? (this.choosingActive = !0,
                            this.handleMouseMove(t), !0) : (this.choosing = !1,
                            t.target === this.canvas && (this.selecting = !0,
                                this.getPaletteColorAtPoint(t)),
                            t.target !== this.canvasLight && t.target !== this.colorRegulator || (this.lightSelecting = !0,
                                this.getColorLightAtClick(t)),
                            t.target !== this.canvasAlpha && t.target !== this.alphaRegulator || (this.alphaSelecting = !0,
                                this.getAlphaAtClick(t)), !1)
                    }
                }, {
                    key: "handleMouseMove",
                    value: function(t) {
                        if (this.opened)
                            this.selecting && this.getPaletteColorAtPoint(t),
                            this.lightSelecting && this.getColorLightAtClick(t),
                            this.alphaSelecting && this.getAlphaAtClick(t);
                        else if (this.choosingActive) {
                            var e = this.main.getScale(),
                                A = (t.clientX - this.main.elLeft() + this.main.scroller.scrollLeft) * e;
                            A = A < 1 && 1 || A,
                                A = A > this.main.size.w - 1 && this.main.size.w - 1 || A;
                            var i = (t.clientY - this.main.elTop() + this.main.scroller.scrollTop) * e;
                            i = i < 1 && 1 || i,
                                i = i > this.main.size.h - 1 && this.main.size.h - 1 || i;
                            var o = this.main.ctx.getImageData(A, i, 1, 1).data,
                                a = n(o[0], o[1], o[2]);
                            this.callback({
                                    alphaColor: r(a, 1),
                                    lightPosition: this.w - 1,
                                    alpha: 1,
                                    palleteColor: a,
                                    target: this.target
                                }),
                                void 0 !== this.addCallback && this.addCallback({
                                    alphaColor: r(a, 1),
                                    lightPosition: this.w - 1,
                                    alpha: 1,
                                    palleteColor: a,
                                    target: this.target
                                })
                        }
                    }
                }, {
                    key: "handleMouseUp",
                    value: function() {
                        this.selecting = !1,
                            this.lightSelecting = !1,
                            this.choosing = !1,
                            this.choosingActive = !1,
                            this.alphaSelecting = !1,
                            this.main.zoomHelper.hideZoomHelper()
                    }
                }, {
                    key: "setActiveColor",
                    value: function(t, e) {
                        try {
                            this.input.style.color = l(t)
                        } catch (t) {
                            return
                        }
                        this.input.style["background-color"] = t,
                            void 0 === e && (this.input.value = t),
                            this.color = t,
                            this.alphaColor = r(t, this.alpha),
                            void 0 !== this.callback && this.opened && this.callback({
                                alphaColor: this.alphaColor,
                                lightPosition: this.lightPosition,
                                alpha: this.alpha,
                                palleteColor: this.color,
                                target: this.target
                            }),
                            void 0 !== this.addCallback && this.opened && this.addCallback({
                                alphaColor: this.alphaColor,
                                lightPosition: this.lightPosition,
                                alpha: this.alpha,
                                palleteColor: this.color,
                                target: this.target
                            })
                    }
                }, {
                    key: "drawLighter",
                    value: function() {
                        var t = this.ctxLight.createLinearGradient(0, 0, this.w, 0);
                        t.addColorStop(0, "#ffffff"),
                            t.addColorStop(.05, "#ffffff"),
                            t.addColorStop(.95, this.palleteColor),
                            t.addColorStop(1, this.palleteColor),
                            this.ctxLight.fillStyle = t,
                            this.ctxLight.fillRect(0, 0, this.w, 15)
                    }
                }, {
                    key: "drawAlpher",
                    value: function() {
                        this.ctxAlpha.clearRect(0, 0, this.w, 15);
                        var t = this.ctxAlpha.createLinearGradient(0, 0, this.w, 0);
                        t.addColorStop(0, "rgba(255,255,255,0)"),
                            t.addColorStop(.05, "rgba(255,255,255,0)"),
                            t.addColorStop(.95, this.color),
                            t.addColorStop(1, this.color),
                            this.ctxAlpha.fillStyle = t,
                            this.ctxAlpha.fillRect(0, 0, this.w, 15)
                    }
                }], [{
                    key: "html",
                    value: function() {
                        return '<div class="ptro-color-widget-wrapper ptro-common-widget-wrapper ptro-v-middle" hidden><div class="ptro-pallet ptro-color-main ptro-v-middle-in"><canvas></canvas><canvas class="ptro-canvas-light"></canvas><span class="ptro-color-light-regulator ptro-bordered-control"></span><canvas class="ptro-canvas-alpha"></canvas><span class="alpha-checkers"></span><span class="ptro-color-alpha-regulator ptro-bordered-control"></span><div class="ptro-colors"></div><div class="ptro-color-edit"><button class="ptro-icon-btn ptro-pipette ptro-color-control" style="float: left; margin-right: 5px"><i class="ptro-icon ptro-icon-pipette"></i></button><input class="ptro-input ptro-color" type="text" size="7"/><button class="ptro-named-btn ptro-close-color-picker ptro-color-control" >' + (0,
                            c.tr)("close") + "</button></div></div></div>"
                    }
                }]),
                t
        }();
    e.default = h
}, function(t, e, A) {
    "use strict";

    function i() {
        try {
            h = JSON.parse(localStorage.getItem(g))
        } catch (t) {
            console.error("Unable get from localstorage: " + t)
        }
        h || (h = {})
    }

    function o(t, e) {
        h[t] = e;
        try {
            localStorage.setItem(g, JSON.stringify(h))
        } catch (t) {
            console.error("Unable save to localstorage: " + t)
        }
    }

    function r() {
        for (var t = 0; t < arguments.length; t += 1)
            if (void 0 !== (arguments.length <= t ? void 0 : arguments[t]))
                return arguments.length <= t ? void 0 : arguments[t]
    }

    function a(t) {
        i();
        var e = t || {};
        e.activeColor = h.activeColor || e.activeColor || "#ff0000",
            e.activeColorAlpha = r(h.activeColorAlpha, e.activeColorAlpha, 1),
            e.activeAlphaColor = (0,
                n.HexToRGBA)(e.activeColor, e.activeColorAlpha),
            e.activeFillColor = h.activeFillColor || e.activeFillColor || "#000000",
            e.activeFillColorAlpha = r(h.activeFillColorAlpha, e.activeFillColorAlpha, 0),
            e.activeFillAlphaColor = (0,
                n.HexToRGBA)(e.activeFillColor, e.activeFillColorAlpha),
            e.initText = e.initText || null,
            e.initTextColor = e.initTextColor || "#808080",
            e.initTextStyle = e.initTextStyle || "26px 'Open Sans', sans-serif",
            e.defaultLineWidth = h.defaultLineWidth || e.defaultLineWidth || 5,
            e.defaultEraserWidth = r(h.defaultEraserWidth, e.defaultEraserWidth, 5),
            e.defaultFontSize = r(h.defaultFontSize, e.defaultFontSize, 24),
            e.fontStrokeSize = r(h.fontStrokeSize, e.fontStrokeSize, 0),
            e.backgroundFillColor = h.backgroundFillColor || e.backgroundFillColor || "#ffffff",
            e.backgroundFillColorAlpha = r(h.backgroundFillColorAlpha, e.backgroundFillColorAlpha, 1),
            e.backgroundFillAlphaColor = (0,
                n.HexToRGBA)(e.backgroundFillColor, e.backgroundFillColorAlpha),
            e.textStrokeColor = h.textStrokeColor || e.textStrokeColor || "#ffffff",
            e.textStrokeColorAlpha = r(h.textStrokeColorAlpha, e.textStrokeColorAlpha, 1),
            e.textStrokeAlphaColor = (0,
                n.HexToRGBA)(e.textStrokeColor, e.textStrokeColorAlpha),
            e.worklogLimit = r(e.worklogLimit, 100),
            e.defaultTool = e.defaultTool || "select",
            e.hiddenTools = e.hiddenTools || [];
        var A = e.hiddenTools.indexOf(e.defaultTool);
        if (A > -1 && ((0,
                    c.logError)("Can't hide default tool '" + e.defaultTool + "', please change default tool to another to hide it"),
                e.hiddenTools.splice(A, 1)),
            e.pixelizePixelSize = h.pixelizePixelSize || e.pixelizePixelSize || "20%",
            e.colorScheme = e.colorScheme || {},
            e.colorScheme.main = e.colorScheme.main || "#dbebff",
            e.colorScheme.control = e.colorScheme.control || "#abc6ff",
            e.colorScheme.controlContent = e.colorScheme.controlContent || "#000000",
            e.colorScheme.hoverControl = e.colorScheme.hoverControl || e.colorScheme.control,
            e.colorScheme.hoverControlContent = e.colorScheme.hoverControlContent || "#1a3d67",
            e.colorScheme.toolControlNameColor = e.colorScheme.toolControlNameColor || "rgba(255,255,255,0.7)",
            e.colorScheme.activeControl = e.colorScheme.activeControl || "#7485B1",
            e.colorScheme.activeControlContent = e.colorScheme.activeControlContent || e.colorScheme.main,
            e.colorScheme.inputBorderColor = e.colorScheme.inputBorderColor || e.colorScheme.main,
            e.colorScheme.inputBackground = e.colorScheme.inputBackground || "#ffffff",
            e.colorScheme.inputText = e.colorScheme.inputText || e.colorScheme.activeControl,
            e.colorScheme.backgroundColor = e.colorScheme.backgroundColor || "#999999",
            e.colorScheme.dragOverBarColor = e.colorScheme.dragOverBarColor || "#899dff",
            e.defaultSize = e.defaultSize || "fill",
            e.defaultPixelSize = e.defaultPixelSize || 4,
            "fill" === e.defaultSize)
            e.defaultSize = {
                width: "fill",
                height: "fill"
            };
        else {
            var o = e.defaultSize.split("x");
            e.defaultSize = {
                width: (0,
                    c.trim)(o[0]),
                height: (0,
                    c.trim)(o[1])
            }
        }
        if (e.translation) {
            var a = e.translation.name;
            s.default.get().addTranslation(a, e.translation.strings),
                s.default.get().activate(a)
        }
        return e.styles = ".ptro-color-main{\n        background-color: " + e.colorScheme.main + ";\n        color: " + e.colorScheme.controlContent + "}\n    .ptro-color-control{\n        background-color: " + e.colorScheme.control + ";\n        color:" + e.colorScheme.controlContent + "}\n    .ptro-tool-ctl-name{\n        background-color: " + e.colorScheme.toolControlNameColor + ";\n    }\n    button.ptro-color-control:hover:not(.ptro-color-active-control):not([disabled]){\n        background-color: " + e.colorScheme.hoverControl + ";\n        color:" + e.colorScheme.hoverControlContent + "}    \n    .ptro-bordered-control{border-color: " + e.colorScheme.activeControl + "}\n    input.ptro-input, input.ptro-input:focus, select.ptro-input, select.ptro-input:focus {\n      border: 1px solid " + e.colorScheme.inputBorderColor + ";\n      background-color: " + e.colorScheme.inputBackground + ";\n      color: " + e.colorScheme.inputText + "\n    }\n    .ptro-bar-dragover{background-color:" + e.colorScheme.dragOverBarColor + "}\n    .ptro-color,.ptro-bordered-btn{\n      border: 1px solid " + e.colorScheme.inputBorderColor + ";\n    }\n    .ptro-color-control:active:enabled {\n        background-color: " + e.colorScheme.activeControl + ";\n        color: " + e.colorScheme.activeControlContent + "}\n    .ptro-color-active-control{\n        background-color: " + e.colorScheme.activeControl + ";\n        color:" + e.colorScheme.activeControlContent + "}\n    .ptro-wrapper{background-color:" + e.colorScheme.backgroundColor + ";}}",
            e
    }
    Object.defineProperty(e, "__esModule", {
            value: !0
        }),
        e.setParam = o,
        e.setDefaults = a;
    var n = A(5),
        l = A(1),
        s = function(t) {
            return t && t.__esModule ? t : {
                default: t
            }
        }(l),
        c = A(0),
        g = "painterro-data",
        h = {}
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = A(1),
        a = A(0),
        n = function() {
            function t() {
                var e = this;
                i(this, t),
                    this.pasteOptions = {
                        fit: {
                            handle: function(t) {
                                e.main.fitImage(t)
                            }
                        },
                        extend_down: {
                            handle: function(t) {
                                e.tmpImg = t;
                                var A = e.main.size.h,
                                    i = e.main.size.w,
                                    o = A + t.naturalHeight,
                                    r = Math.max(i, t.naturalWidth),
                                    a = e.ctx.getImageData(0, 0, e.main.size.w, e.main.size.h);
                                if (e.main.resize(r, o),
                                    e.main.clearBackground(),
                                    e.ctx.putImageData(a, 0, 0),
                                    e.main.adjustSizeFull(),
                                    t.naturalWidth < i) {
                                    var n = Math.round((i - t.naturalWidth) / 2);
                                    e.main.select.placeAt(n, A, n, 0, t)
                                } else
                                    e.main.select.placeAt(0, A, 0, 0, t);
                                e.worklog.captureState()
                            }
                        },
                        extend_right: {
                            handle: function(t) {
                                e.tmpImg = t;
                                var A = e.main.size.h,
                                    i = e.main.size.w,
                                    o = i + t.naturalWidth,
                                    r = Math.max(A, t.naturalHeight),
                                    a = e.ctx.getImageData(0, 0, e.main.size.w, e.main.size.h);
                                if (e.main.resize(o, r),
                                    e.main.clearBackground(),
                                    e.ctx.putImageData(a, 0, 0),
                                    e.main.adjustSizeFull(),
                                    t.naturalHeight < A) {
                                    var n = Math.round((A - t.naturalHeight) / 2);
                                    e.main.select.placeAt(i, n, 0, n, t)
                                } else
                                    e.main.select.placeAt(i, 0, 0, 0, t);
                                e.worklog.captureState()
                            }
                        },
                        over: {
                            handle: function(t) {
                                e.tmpImg = t;
                                var A = e.main.size.h,
                                    i = e.main.size.w;
                                if (t.naturalHeight <= A && t.naturalWidth <= i)
                                    e.main.select.placeAt(0, 0, i - t.naturalWidth, A - t.naturalHeight, t);
                                else if (t.naturalWidth / t.naturalHeight > i / A) {
                                    var o = i * (t.naturalHeight / t.naturalWidth);
                                    e.main.select.placeAt(0, 0, 0, A - o, t)
                                } else {
                                    var r = A * (t.naturalWidth / t.naturalHeight);
                                    e.main.select.placeAt(0, 0, i - r, 0, t)
                                }
                                e.worklog.captureState()
                            }
                        }
                    }
            }
            return o(t, [{
                    key: "init",
                    value: function(t) {
                        var e = this;
                        this.CLIP_DATA_MARKER = "painterro-image-data",
                            this.ctx = t.ctx,
                            this.main = t,
                            this.worklog = t.worklog,
                            this.selector = t.wrapper.querySelector(".ptro-paster-select-wrapper"),
                            this.cancelChoosing(),
                            this.img = null,
                            Object.keys(this.pasteOptions).forEach(function(t) {
                                var A = e.pasteOptions[t];
                                e.main.doc.getElementById(A.id).onclick = function() {
                                    e.loading ? e.doLater = A.handle : A.handle(e.img),
                                        e.cancelChoosing()
                                }
                            }),
                            this.loading = !1,
                            this.doLater = null
                    }
                }, {
                    key: "insert",
                    value: function(t, e, A, i) {
                        this.main.ctx.drawImage(this.tmpImg, t, e, A, i),
                            this.main.worklog.reCaptureState()
                    }
                }, {
                    key: "cancelChoosing",
                    value: function() {
                        this.selector.setAttribute("hidden", ""),
                            this.waitChoice = !1
                    }
                }, {
                    key: "loaded",
                    value: function(t) {
                        this.img = t,
                            this.loading = !1,
                            this.doLater && (this.doLater(t),
                                this.doLater = null)
                    }
                }, {
                    key: "handleOpen",
                    value: function(t) {
                        var e = this;
                        this.startLoading();
                        var A = function(t) {
                            var A = new Image,
                                i = e.main.worklog.clean;
                            A.onload = function() {
                                    i ? e.main.fitImage(A) : e.loaded(A),
                                        e.finishLoading()
                                },
                                A.src = t,
                                i || (e.selector.removeAttribute("hidden"),
                                    e.waitChoice = !0)
                        };
                        0 !== t.indexOf("data") ? (0,
                            a.imgToDataURL)(t, function(t) {
                            A(t)
                        }) : A(t)
                    }
                }, {
                    key: "handleKeyDown",
                    value: function(t) {
                        if (this.waitChoice && t.keyCode === a.KEYS.esc && this.cancelChoosing(), !this.waitChoice && !this.main.select.imagePlaced && this.main.select.shown && t.keyCode === a.KEYS.c && (t.ctrlKey || t.metaKey)) {
                            var e = this.main.select.area,
                                A = e.bottoml[0] - e.topl[0],
                                i = e.bottoml[1] - e.topl[1],
                                o = this.main.doc.createElement("canvas");
                            o.width = A,
                                o.height = i;
                            o.getContext("2d").drawImage(this.main.canvas, -e.topl[0], -e.topl[1]),
                                (0,
                                    a.copyToClipboard)(this.CLIP_DATA_MARKER);
                            try {
                                localStorage.setItem(this.CLIP_DATA_MARKER, o.toDataURL())
                            } catch (t) {
                                console.error("Unable save image to localstorage: " + t)
                            }
                        }
                    }
                }, {
                    key: "startLoading",
                    value: function() {
                        this.loading = !0;
                        var t = this.main.doc.getElementById(this.main.toolByName.open.buttonId),
                            e = this.main.doc.querySelector("#" + this.main.toolByName.open.buttonId + " > i");
                        t && t.setAttribute("disabled", "true"),
                            e && (e.className = "ptro-icon ptro-icon-loading ptro-spinning")
                    }
                }, {
                    key: "finishLoading",
                    value: function() {
                        var t = this.main.doc.getElementById(this.main.toolByName.open.buttonId),
                            e = this.main.doc.querySelector("#" + this.main.toolByName.open.buttonId + " > i");
                        t && t.removeAttribute("disabled"),
                            e && (e.className = "ptro-icon ptro-icon-open")
                    }
                }, {
                    key: "html",
                    value: function() {
                        var t = this,
                            e = "";
                        return Object.keys(this.pasteOptions).forEach(function(A) {
                                var i = t.pasteOptions[A];
                                i.id = (0,
                                        a.genId)(),
                                    e += '<button id="' + i.id + '" class="ptro-selector-btn ptro-color-control"><div><i class="ptro-icon ptro-icon-paste_' + A + '"></i></div><div>' + (0,
                                        r.tr)("pasteOptions." + A) + "</div></button>"
                            }),
                            '<div class="ptro-paster-select-wrapper" hidden><div class="ptro-paster-select ptro-v-middle"><div class="ptro-in ptro-v-middle-in"><div class="ptro-paste-label">' + (0,
                                r.tr)("pasteOptions.how_to_paste") + "</div>" + e + "</div></div></div>"
                    }
                }]),
                t
        }();
    e.default = n
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = function() {
            function t(e) {
                i(this, t),
                    this.ctx = e.ctx,
                    this.el = e.toolContainer,
                    this.main = e,
                    this.helperCanvas = document.createElement("canvas"),
                    this.canvas = e.canvas
            }
            return o(t, [{
                    key: "activate",
                    value: function(t) {
                        this.type = t,
                            this.state = {},
                            this.ctx.lineJoin = "line" === t || "brush" === t || "eraser" === t ? "round" : "miter"
                    }
                }, {
                    key: "setLineWidth",
                    value: function(t) {
                        this.lineWidth = t
                    }
                }, {
                    key: "setEraserWidth",
                    value: function(t) {
                        this.eraserWidth = t
                    }
                }, {
                    key: "handleMouseDown",
                    value: function(t) {
                        this.activate(this.type);
                        var e = t.target.classList[0];
                        this.ctx.lineWidth = this.lineWidth,
                            this.ctx.strokeStyle = this.main.colorWidgetState.line.alphaColor,
                            this.ctx.fillStyle = this.main.colorWidgetState.fill.alphaColor;
                        var A = this.main.getScale();
                        if (this.ctx.lineCap = "round",
                            "ptro-crp-el" === e || "ptro-zoomer" === e)
                            if (this.tmpData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h),
                                "brush" === this.type || "eraser" === this.type) {
                                this.state.cornerMarked = !0;
                                var i = [t.clientX - this.main.elLeft() + this.main.scroller.scrollLeft, t.clientY - this.main.elTop() + this.main.scroller.scrollTop],
                                    o = {
                                        x: i[0] * A,
                                        y: i[1] * A
                                    };
                                this.points = [o],
                                    this.drawBrushPath()
                            } else
                                this.state.cornerMarked = !0,
                                this.centerCord = [t.clientX - this.main.elLeft() + this.main.scroller.scrollLeft, t.clientY - this.main.elTop() + this.main.scroller.scrollTop],
                                this.centerCord = [this.centerCord[0] * A, this.centerCord[1] * A]
                    }
                }, {
                    key: "drawBrushPath",
                    value: function() {
                        var t = this,
                            e = this.points,
                            A = void 0,
                            i = this.ctx.globalCompositeOperation,
                            o = "eraser" === this.type;
                        A = this.main.colorWidgetState.line.alphaColor;
                        for (var r = 1 !== this.main.currentBackgroundAlpha, a = 1; a <= (o && r ? 2 : 1); a += 1)
                            if (o && (this.ctx.globalCompositeOperation = 1 === a && r ? "destination-out" : i,
                                    A = 1 === a && r ? "rgba(0,0,0,1)" : this.main.currentBackground),
                                1 === e.length)
                                this.ctx.beginPath(),
                                this.ctx.lineWidth = 0,
                                this.ctx.fillStyle = A,
                                this.ctx.arc(this.points[0].x, this.points[0].y, this.lineWidth / 2, this.lineWidth / 2, 0, 2 * Math.PI),
                                this.ctx.fill(),
                                this.ctx.closePath();
                            else {
                                this.ctx.beginPath(),
                                    "eraser" === this.type ? this.ctx.lineWidth = this.eraserWidth : this.ctx.lineWidth = this.lineWidth,
                                    this.ctx.strokeStyle = A,
                                    this.ctx.fillStyle = this.main.colorWidgetState.fill.alphaColor,
                                    this.ctx.moveTo(this.points[0].x, this.points[0].y);
                                var n = void 0;
                                e.slice(1).forEach(function(e) {
                                        t.ctx.lineTo(e.x, e.y),
                                            n = e
                                    }),
                                    n && this.ctx.moveTo(n.x, n.y),
                                    this.ctx.stroke(),
                                    this.ctx.closePath()
                            }
                        this.ctx.globalCompositeOperation = i
                    }
                }, {
                    key: "handleMouseMove",
                    value: function(t) {
                        if (this.state.cornerMarked) {
                            this.ctx.putImageData(this.tmpData, 0, 0),
                                this.curCord = [t.clientX - this.main.elLeft() + this.main.scroller.scrollLeft, t.clientY - this.main.elTop() + this.main.scroller.scrollTop];
                            var e = this.main.getScale();
                            if (this.curCord = [this.curCord[0] * e, this.curCord[1] * e],
                                "brush" === this.type || "eraser" === this.type) {
                                var A = {
                                    x: this.curCord[0],
                                    y: this.curCord[1]
                                };
                                this.points.push(A),
                                    this.drawBrushPath()
                            } else if ("line" === this.type) {
                                if (t.ctrlKey || t.shiftKey) {
                                    var i = 180 * Math.atan(-(this.curCord[1] - this.centerCord[1]) / (this.curCord[0] - this.centerCord[0])) / Math.PI;
                                    if (Math.abs(i) < 22.5)
                                        this.curCord[1] = this.centerCord[1];
                                    else if (Math.abs(i) > 45)
                                        this.curCord[0] = this.centerCord[0];
                                    else {
                                        var o = (Math.abs(this.curCord[0] - this.centerCord[0]) - Math.abs(this.centerCord[1] - this.curCord[1])) / 2;
                                        this.curCord[0] -= o * (this.centerCord[0] < this.curCord[0] ? 1 : -1),
                                            this.curCord[1] -= o * (this.centerCord[1] > this.curCord[1] ? 1 : -1)
                                    }
                                }
                                this.ctx.beginPath(),
                                    this.ctx.moveTo(this.centerCord[0], this.centerCord[1]),
                                    this.ctx.lineTo(this.curCord[0], this.curCord[1]),
                                    this.ctx.closePath(),
                                    this.ctx.stroke()
                            } else if ("rect" === this.type) {
                                this.ctx.beginPath();
                                var r = [this.centerCord[0], this.centerCord[1]],
                                    a = this.curCord[0] - this.centerCord[0],
                                    n = this.curCord[1] - this.centerCord[1];
                                if (t.ctrlKey || t.shiftKey) {
                                    var l = Math.min(Math.abs(a), Math.abs(n));
                                    a = l * Math.sign(a),
                                        n = l * Math.sign(n)
                                }
                                var s = Math.floor(this.lineWidth / 2),
                                    c = this.lineWidth % 2;
                                this.ctx.rect(r[0] + s, r[1] + s, a - this.lineWidth + c, n - this.lineWidth + c),
                                    this.ctx.fill(),
                                    this.ctx.strokeRect(r[0], r[1], a, n),
                                    this.ctx.closePath()
                            } else if ("ellipse" === this.type) {
                                this.ctx.beginPath();
                                var g = this.centerCord[0],
                                    h = this.centerCord[1],
                                    u = this.curCord[0] - g,
                                    M = this.curCord[1] - h;
                                if (t.ctrlKey || t.shiftKey) {
                                    var p = Math.min(Math.abs(u), Math.abs(M));
                                    u = p * Math.sign(u),
                                        M = p * Math.sign(M)
                                }
                                var d = Math.abs(u),
                                    N = Math.abs(M),
                                    D = Math.min(g, g + u),
                                    T = Math.min(h, h + M);
                                this.ctx.save();
                                var I = 1,
                                    w = 1,
                                    C = void 0,
                                    z = d / 2,
                                    k = N / 2;
                                d > N ? (w = d / N,
                                        C = z) : (I = N / d,
                                        C = k),
                                    this.ctx.scale(1 / I, 1 / w),
                                    this.ctx.arc((D + z) * I, (T + k) * w, C, 0, 2 * Math.PI),
                                    this.ctx.restore(),
                                    this.ctx.fill(),
                                    this.ctx.stroke(),
                                    this.ctx.beginPath()
                            }
                        }
                    }
                }, {
                    key: "handleMouseUp",
                    value: function() {
                        this.state.cornerMarked && (this.state.cornerMarked = !1,
                            this.main.worklog.captureState())
                    }
                }, {
                    key: "setPixelSize",
                    value: function(t) {
                        this.pixelSize = t
                    }
                }]),
                t
        }();
    e.default = r
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = A(1),
        a = A(0),
        n = function() {
            function t(e) {
                var A = this;
                i(this, t),
                    this.main = e,
                    this.wrapper = e.wrapper.querySelector(".ptro-resize-widget-wrapper"),
                    this.inputW = e.wrapper.querySelector(".ptro-resize-widget-wrapper .ptro-resize-width-input"),
                    this.inputH = e.wrapper.querySelector(".ptro-resize-widget-wrapper .ptro-resize-heigth-input"),
                    this.linkButton = e.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-link"),
                    this.linkButtonIcon = e.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-link i"),
                    this.closeButton = e.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-close"),
                    this.scaleButton = e.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-scale"),
                    this.resizeButton = e.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-resize"),
                    this.linked = !0,
                    this.closeButton.onclick = function() {
                        A.startClose()
                    },
                    this.scaleButton.onclick = function() {
                        var t = A.main.size.w,
                            e = A.main.size.h,
                            i = A.main.canvas.toDataURL();
                        A.main.resize(A.newW, A.newH),
                            A.main.ctx.save(),
                            A.main.ctx.scale(A.newW / t, A.newH / e);
                        var o = new Image;
                        o.onload = function() {
                                A.main.ctx.drawImage(o, 0, 0),
                                    A.main.adjustSizeFull(),
                                    A.main.ctx.restore(),
                                    A.main.worklog.captureState(),
                                    A.startClose()
                            },
                            o.src = i
                    },
                    this.resizeButton.onclick = function() {
                        var t = A.main.canvas.toDataURL();
                        A.main.resize(A.newW, A.newH),
                            A.main.clearBackground();
                        var e = new Image;
                        e.onload = function() {
                                A.main.ctx.drawImage(e, 0, 0),
                                    A.main.adjustSizeFull(),
                                    A.main.worklog.captureState(),
                                    A.startClose()
                            },
                            e.src = t
                    },
                    this.linkButton.onclick = function() {
                        A.linked = !A.linked,
                            A.linked ? A.linkButtonIcon.className = "ptro-icon ptro-icon-linked" : A.linkButtonIcon.className = "ptro-icon ptro-icon-unlinked"
                    },
                    this.inputW.oninput = function() {
                        if (A.newW = A.inputW.value,
                            A.linked) {
                            var t = A.main.size.ratio;
                            A.newH = Math.round(A.newW / t),
                                A.inputH.value = A.newH
                        }
                    },
                    this.inputH.oninput = function() {
                        if (A.newH = A.inputH.value,
                            A.linked) {
                            var t = A.main.size.ratio;
                            A.newW = Math.round(A.newH * t),
                                A.inputW.value = A.newW
                        }
                    }
            }
            return o(t, [{
                    key: "open",
                    value: function() {
                        this.wrapper.removeAttribute("hidden"),
                            this.opened = !0,
                            this.newW = this.main.size.w,
                            this.newH = this.main.size.h,
                            this.inputW.value = this.newW,
                            this.inputH.value = this.newH
                    }
                }, {
                    key: "close",
                    value: function() {
                        this.wrapper.setAttribute("hidden", "true"),
                            this.opened = !1
                    }
                }, {
                    key: "startClose",
                    value: function() {
                        this.main.closeActiveTool()
                    }
                }, {
                    key: "handleKeyDown",
                    value: function(t) {
                        t.keyCode === a.KEYS.esc && this.startClose()
                    }
                }], [{
                    key: "html",
                    value: function() {
                        return '<div class="ptro-resize-widget-wrapper ptro-common-widget-wrapper ptro-v-middle" hidden><div class="ptro-resize-widget ptro-color-main ptro-v-middle-in"><div style="display: inline-block"><table><tr><td class="ptro-label ptro-resize-table-left">' + (0,
                            r.tr)("width") + '</td><td><input class="ptro-input ptro-resize-width-input" type="number" min="0" max="3000" step="1"/></td></tr><tr><td class="ptro-label ptro-resize-table-left">' + (0,
                            r.tr)("height") + '</td><td><input class="ptro-input ptro-resize-heigth-input" type="number" min="0" max="3000" step="1"/></td></tr></table></div><div class="ptro-resize-link-wrapper"><button class="ptro-icon-btn ptro-link ptro-color-control" title="' + (0,
                            r.tr)("keepRatio") + '"><i class="ptro-icon ptro-icon-linked" style="font-size: 18px;"></i></button></div><div></div><div style="margin-top: 40px;"><button class="ptro-named-btn ptro-resize ptro-color-control">' + (0,
                            r.tr)("resizeResize") + '</button><button class="ptro-named-btn ptro-scale ptro-color-control">' + (0,
                            r.tr)("resizeScale") + '</button><button class="ptro-named-btn ptro-close ptro-color-control">' + (0,
                            r.tr)("cancel") + "</button></div></div></div>"
                    }
                }]),
                t
        }();
    e.default = n
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = A(0),
        a = function() {
            function t(e, A) {
                i(this, t),
                    this.main = e,
                    this.canvas = e.canvas,
                    this.wrapper = e.wrapper,
                    this.ctx = e.ctx,
                    this.areaionCallback = A,
                    this.shown = !1,
                    this.area = {
                        el: e.toolContainer,
                        rect: document.querySelector("#" + e.id + " .ptro-crp-rect")
                    },
                    this.imagePlaced = !1,
                    this.pixelizePixelSize = e.params.pixelizePixelSize
            }
            return o(t, [{
                    key: "activate",
                    value: function() {
                        this.area.activated = !0,
                            this.areaionCallback(!1)
                    }
                }, {
                    key: "doCrop",
                    value: function() {
                        var t = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
                        this.main.resize(this.area.bottoml[0] - this.area.topl[0], this.area.bottoml[1] - this.area.topl[1]),
                            this.main.ctx.putImageData(t, -this.area.topl[0], -this.area.topl[1]),
                            this.main.adjustSizeFull(),
                            this.main.worklog.captureState()
                    }
                }, {
                    key: "doPixelize",
                    value: function() {
                        var t = this.area.topl,
                            e = [this.area.bottoml[0] - this.area.topl[0], this.area.bottoml[1] - this.area.topl[1]];
                        "%" === this.pixelizePixelSize.slice(-1) ? this.pixelSize = Math.min(e[0], e[1]) / (100 / this.pixelizePixelSize.slice(0, -1)) : "px" === this.pixelizePixelSize.slice(-2).toLowerCase() ? this.pixelSize = this.pixelizePixelSize.slice(0, -2) : this.pixelSize = this.pixelizePixelSize,
                            this.pixelSize < 2 && (this.pixelSize = 2);
                        for (var A = [], i = [e[0] / this.pixelSize, e[1] / this.pixelSize], o = 0; o < i[0]; o += 1) {
                            for (var r = [], a = 0; a < i[1]; a += 1)
                                r.push([0, 0, 0, 0, 0]);
                            A.push(r)
                        }
                        for (var n = this.ctx.getImageData(t[0], t[1], e[0], e[1]), l = 0; l < e[0]; l += 1)
                            for (var s = 0; s < e[1]; s += 1) {
                                var c = Math.floor(l / this.pixelSize),
                                    g = Math.floor(s / this.pixelSize),
                                    h = 4 * (s * e[0] + l);
                                A[c][g][0] += n.data[h],
                                    A[c][g][1] += n.data[h + 1],
                                    A[c][g][2] += n.data[h + 2],
                                    A[c][g][3] += n.data[h + 3],
                                    A[c][g][4] += 1
                            }
                        for (var u = 0; u < i[0]; u += 1)
                            for (var M = 0; M < i[1]; M += 1) {
                                var p = A[u][M][4];
                                this.ctx.fillStyle = "rgba(\n" + Math.round(A[u][M][0] / p) + ", \n" + Math.round(A[u][M][1] / p) + ", \n" + Math.round(A[u][M][2] / p) + ", \n" + Math.round(A[u][M][3] / p) + ")";
                                var d = t[0] + u * this.pixelSize,
                                    N = t[1] + M * this.pixelSize;
                                this.ctx.fillRect(d, N, this.pixelSize, this.pixelSize)
                            }
                        this.main.worklog.captureState()
                    }
                }, {
                    key: "doClearArea",
                    value: function() {
                        this.ctx.beginPath(),
                            this.ctx.clearRect(this.area.topl[0], this.area.topl[1], this.area.bottoml[0] - this.area.topl[0], this.area.bottoml[1] - this.area.topl[1]),
                            this.ctx.rect(this.area.topl[0], this.area.topl[1], this.area.bottoml[0] - this.area.topl[0], this.area.bottoml[1] - this.area.topl[1]),
                            this.ctx.fillStyle = this.main.currentBackground,
                            this.ctx.fill(),
                            this.main.worklog.captureState()
                    }
                }, {
                    key: "selectAll",
                    value: function() {
                        this.setLeft(0),
                            this.setRight(0),
                            this.setBottom(0),
                            this.setTop(0),
                            this.show(),
                            this.reCalcCropperCords(),
                            this.area.activated && this.areaionCallback(this.area.rect.clientWidth > 0 && this.area.rect.clientHeight > 0)
                    }
                }, {
                    key: "getScale",
                    value: function() {
                        return this.canvas.clientWidth / this.canvas.getAttribute("width")
                    }
                }, {
                    key: "reCalcCropperCords",
                    value: function() {
                        var t = this.getScale();
                        this.area.topl = [Math.round((this.rectLeft() - this.main.elLeft()) / t), Math.round((this.rectTop() - this.main.elTop()) / t)],
                            this.area.bottoml = [Math.round(this.area.topl[0] + (this.area.rect.clientWidth + 2) / t), Math.round(this.area.topl[1] + (this.area.rect.clientHeight + 2) / t)]
                    }
                }, {
                    key: "adjustPosition",
                    value: function() {
                        if (this.shown) {
                            var t = this.getScale();
                            this.setLeft(this.area.topl[0] * t),
                                this.setTop(this.area.topl[1] * t),
                                this.setRight(0),
                                this.setRight(this.canvas.clientWidth - this.area.bottoml[0] * t),
                                this.setBottom(this.canvas.clientHeight - this.area.bottoml[1] * t)
                        }
                    }
                }, {
                    key: "placeAt",
                    value: function(t, e, A, i, o) {
                        this.main.closeActiveTool(!0),
                            this.main.setActiveTool(this.main.toolByName.select);
                        var r = this.getScale();
                        this.setLeft(t * r),
                            this.setTop(e * r),
                            this.setRight(A * r),
                            this.setBottom(i * r);
                        var a = document.createElement("canvas");
                        a.width = o.naturalWidth,
                            a.height = o.naturalHeight;
                        var n = a.getContext("2d");
                        n.drawImage(o, 0, 0),
                            this.placedData = a.toDataURL("image/png");
                        var l = 1e3 / Math.max(o.naturalWidth, o.naturalHeight);
                        l >= 1 ? this.placedDataLow = this.placedData : (a.width = o.naturalWidth * l,
                                a.height = o.naturalHeight * l,
                                n.scale(l, l),
                                n.drawImage(o, 0, 0),
                                this.placedDataLow = a.toDataURL("image/png")),
                            this.main.select.area.rect.style["background-image"] = "url(" + this.placedData + ")",
                            this.show(),
                            this.reCalcCropperCords(),
                            this.imagePlaced = !0,
                            this.placedRatio = o.naturalWidth / o.naturalHeight
                    }
                }, {
                    key: "finishPlacing",
                    value: function() {
                        this.imagePlaced = !1,
                            this.main.select.area.rect.style["background-image"] = "none",
                            this.main.inserter.insert(this.area.topl[0], this.area.topl[1], this.area.bottoml[0] - this.area.topl[0], this.area.bottoml[1] - this.area.topl[1])
                    }
                }, {
                    key: "cancelPlacing",
                    value: function() {
                        this.imagePlaced = !1,
                            this.main.select.area.rect.style["background-image"] = "none",
                            this.hide(),
                            this.main.worklog.undoState()
                    }
                }, {
                    key: "handleKeyDown",
                    value: function(t) {
                        this.main.inserter.handleKeyDown(t),
                            this.shown && this.imagePlaced ? t.keyCode === r.KEYS.enter ? this.finishPlacing() : t.keyCode === r.KEYS.esc && this.cancelPlacing() : this.shown && t.keyCode === r.KEYS.del ? this.doClearArea() : t.keyCode === r.KEYS.a && t.ctrlKey ? (this.selectAll(),
                                event.preventDefault()) : t.keyCode === r.KEYS.esc && this.shown && this.hide()
                    }
                }, {
                    key: "handleMouseDown",
                    value: function(t) {
                        var e = this,
                            A = t.target.classList[0],
                            i = {
                                "ptro-crp-el": function() {
                                    if (e.area.activated) {
                                        e.imagePlaced && e.finishPlacing();
                                        var A = t.clientX - e.main.elLeft() + e.main.scroller.scrollLeft,
                                            i = t.clientY - e.main.elTop() + e.main.scroller.scrollTop;
                                        e.setLeft(A),
                                            e.setTop(i),
                                            e.setRight(e.area.el.clientWidth - A),
                                            e.setBottom(e.area.el.clientHeight - i),
                                            e.reCalcCropperCords(),
                                            e.area.resizingB = !0,
                                            e.area.resizingR = !0,
                                            e.hide()
                                    }
                                },
                                "ptro-crp-rect": function() {
                                    e.area.moving = !0,
                                        e.area.xHandle = t.clientX - e.rectLeft() + e.main.scroller.scrollLeft,
                                        e.area.yHandle = t.clientY - e.rectTop() + e.main.scroller.scrollTop
                                },
                                "ptro-crp-tr": function() {
                                    e.area.resizingT = !0,
                                        e.area.resizingR = !0
                                },
                                "ptro-crp-br": function() {
                                    e.area.resizingB = !0,
                                        e.area.resizingR = !0
                                },
                                "ptro-crp-bl": function() {
                                    e.area.resizingB = !0,
                                        e.area.resizingL = !0
                                },
                                "ptro-crp-tl": function() {
                                    e.area.resizingT = !0,
                                        e.area.resizingL = !0
                                },
                                "ptro-crp-t": function() {
                                    e.area.resizingT = !0
                                },
                                "ptro-crp-r": function() {
                                    e.area.resizingR = !0
                                },
                                "ptro-crp-b": function() {
                                    e.area.resizingB = !0
                                },
                                "ptro-crp-l": function() {
                                    e.area.resizingL = !0
                                }
                            };
                        A in i && (i[A](),
                            this.imagePlaced && (this.main.select.area.rect.style["background-image"] = "url(" + this.placedDataLow + ")"))
                    }
                }, {
                    key: "setLeft",
                    value: function(t) {
                        this.left = t,
                            this.area.rect.style.left = t + "px"
                    }
                }, {
                    key: "setRight",
                    value: function(t) {
                        this.right = t,
                            this.area.rect.style.right = t + "px"
                    }
                }, {
                    key: "setTop",
                    value: function(t) {
                        this.top = t,
                            this.area.rect.style.top = t + "px"
                    }
                }, {
                    key: "setBottom",
                    value: function(t) {
                        this.bottom = t,
                            this.area.rect.style.bottom = t + "px"
                    }
                }, {
                    key: "handleMouseMove",
                    value: function(t) {
                        if (this.area.activated)
                            if (this.area.moving) {
                                var e = t.clientX - this.main.elLeft() - this.area.xHandle + this.main.scroller.scrollLeft;
                                e < 0 ? e = 0 : e + this.area.rect.clientWidth > this.area.el.clientWidth - 2 && (e = this.area.el.clientWidth - this.area.rect.clientWidth - 2);
                                var A = e - this.left;
                                this.setLeft(e),
                                    this.setRight(this.right - A);
                                var i = t.clientY - this.main.elTop() - this.area.yHandle + this.main.scroller.scrollTop;
                                i < 0 ? i = 0 : i + this.area.rect.clientHeight > this.area.el.clientHeight - 2 && (i = this.area.el.clientHeight - this.area.rect.clientHeight - 2);
                                var o = i - this.top;
                                this.setTop(i),
                                    this.setBottom(this.bottom - o),
                                    this.reCalcCropperCords()
                            } else {
                                var a = !1;
                                if (this.area.resizingL) {
                                    a = !0;
                                    var n = this.fixCropperLeft(t.clientX + this.main.scroller.scrollLeft);
                                    this.setLeft(n - this.main.elLeft()),
                                        this.reCalcCropperCords()
                                }
                                if (this.area.resizingR) {
                                    a = !0;
                                    var l = this.fixCropperRight(t.clientX + this.main.scroller.scrollLeft);
                                    this.setRight(this.area.el.clientWidth + this.main.elLeft() - l),
                                        this.reCalcCropperCords()
                                }
                                if (this.area.resizingT) {
                                    a = !0;
                                    var s = this.fixCropperTop(t.clientY + this.main.scroller.scrollTop);
                                    this.setTop(s - this.main.elTop()),
                                        this.reCalcCropperCords()
                                }
                                if (this.area.resizingB) {
                                    a = !0;
                                    var c = this.fixCropperBottom(t.clientY + this.main.scroller.scrollTop);
                                    this.setBottom(this.area.el.clientHeight + this.main.elTop() - c),
                                        this.reCalcCropperCords()
                                }!this.imagePlaced || t.ctrlKey || t.shiftKey || (this.area.resizingT && (this.area.resizingL ? this.leftKeepRatio() : this.rightKeepRatio(),
                                            this.topKeepRatio(),
                                            this.reCalcCropperCords()),
                                        this.area.resizingB && (this.area.resizingL ? this.leftKeepRatio() : this.rightKeepRatio(),
                                            this.bottomKeepRatio(),
                                            this.reCalcCropperCords()),
                                        this.area.resizingL && (this.area.resizingT ? this.topKeepRatio() : this.bottomKeepRatio(),
                                            this.leftKeepRatio(),
                                            this.reCalcCropperCords()),
                                        this.area.resizingR && (this.area.resizingT ? this.topKeepRatio() : this.bottomKeepRatio(),
                                            this.rightKeepRatio(),
                                            this.reCalcCropperCords())),
                                    a && !this.shown && this.show(),
                                    a && (0,
                                        r.clearSelection)()
                            }
                    }
                }, {
                    key: "leftKeepRatio",
                    value: function() {
                        var t = this.area.rect.clientHeight * this.placedRatio,
                            e = this.main.elLeft() + (this.area.el.clientWidth - this.right - t - 2),
                            A = this.fixCropperLeft(e);
                        this.setLeft(A - this.main.elLeft())
                    }
                }, {
                    key: "topKeepRatio",
                    value: function() {
                        var t = this.area.rect.clientWidth / this.placedRatio,
                            e = this.fixCropperTop(this.main.elTop() + (this.area.el.clientHeight - this.bottom - t - 2));
                        this.setTop(e - this.main.elTop())
                    }
                }, {
                    key: "bottomKeepRatio",
                    value: function() {
                        var t = this.area.rect.clientWidth / this.placedRatio,
                            e = this.fixCropperBottom(this.main.elTop() + this.top + t + 2);
                        this.setBottom(this.area.el.clientHeight + this.main.elTop() - e)
                    }
                }, {
                    key: "rightKeepRatio",
                    value: function() {
                        var t = this.area.rect.clientHeight * this.placedRatio,
                            e = this.fixCropperRight(this.main.elLeft() + this.left + t + 2);
                        this.setRight(this.area.el.clientWidth + this.main.elLeft() - e)
                    }
                }, {
                    key: "show",
                    value: function() {
                        this.shown = !0,
                            this.area.rect.removeAttribute("hidden")
                    }
                }, {
                    key: "handleMouseUp",
                    value: function() {
                        this.area.activated && this.areaionCallback(this.area.rect.clientWidth > 0 && this.area.rect.clientHeight > 0),
                            this.area.moving = !1,
                            this.area.resizingT = !1,
                            this.area.resizingR = !1,
                            this.area.resizingB = !1,
                            this.area.resizingL = !1,
                            this.imagePlaced && (this.main.select.area.rect.style["background-image"] = "url(" + this.placedData + ")")
                    }
                }, {
                    key: "close",
                    value: function() {
                        this.imagePlaced && this.finishPlacing(),
                            this.area.activated = !1,
                            this.hide()
                    }
                }, {
                    key: "hide",
                    value: function() {
                        this.area.rect.setAttribute("hidden", "true"),
                            this.shown = !1,
                            this.areaionCallback(!1)
                    }
                }, {
                    key: "draw",
                    value: function() {
                        if (this.area.topl) {
                            var t = this.canvas.clientWidth / this.canvas.getAttribute("width");
                            this.setLeft(this.area.topl[0] * t),
                                this.setTop(this.area.topl[1] * t),
                                this.setRight(this.area.el.clientWidth - (this.area.bottoml[0] - this.area.topl[0]) * t),
                                this.setBottom(this.area.el.clientHeight - (this.area.bottoml[1] - this.area.topl[1]) * t)
                        }
                    }
                }, {
                    key: "rectLeft",
                    value: function() {
                        return this.area.rect.documentOffsetLeft + this.main.scroller.scrollLeft
                    }
                }, {
                    key: "rectTop",
                    value: function() {
                        return this.area.rect.documentOffsetTop + this.main.scroller.scrollTop
                    }
                }, {
                    key: "fixCropperLeft",
                    value: function(t) {
                        var e = t,
                            A = this.rectLeft() + this.area.rect.clientWidth;
                        return e < this.main.elLeft() ? this.main.elLeft() : (e > A && (e = A,
                                this.area.resizingL && (this.area.resizingL = !1,
                                    this.area.resizingR = !0)),
                            e)
                    }
                }, {
                    key: "fixCropperRight",
                    value: function(t) {
                        var e = t,
                            A = this.main.elLeft() + this.area.el.clientWidth;
                        return e > A ? A : (e < this.rectLeft() && (e = this.rectLeft() + this.area.rect.clientWidth,
                                this.area.resizingR && (this.area.resizingR = !1,
                                    this.area.resizingL = !0)),
                            e)
                    }
                }, {
                    key: "fixCropperTop",
                    value: function(t) {
                        var e = t,
                            A = this.rectTop() + this.area.rect.clientHeight;
                        return e < this.main.elTop() ? this.main.elTop() : (e > A && (e = A,
                                this.area.resizingT && (this.area.resizingT = !1,
                                    this.area.resizingB = !0)),
                            e)
                    }
                }, {
                    key: "fixCropperBottom",
                    value: function(t) {
                        var e = t,
                            A = this.main.elTop() + this.area.el.clientHeight;
                        return e > A ? A : (e < this.rectTop() && (e = this.rectTop() + this.area.rect.clientHeight,
                                this.area.resizingB && (this.area.resizingB = !1,
                                    this.area.resizingT = !0)),
                            e)
                    }
                }], [{
                    key: "code",
                    value: function() {
                        return '<div class="ptro-crp-rect" hidden><div class="ptro-crp-l select-handler"></div><div class="ptro-crp-r select-handler"></div><div class="ptro-crp-t select-handler"></div><div class="ptro-crp-b select-handler"></div><div class="ptro-crp-tl select-handler"></div><div class="ptro-crp-tr select-handler"></div><div class="ptro-crp-bl select-handler"></div><div class="ptro-crp-br select-handler"></div></div>'
                    }
                }]),
                t
        }();
    e.default = a
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = A(1),
        a = A(0),
        n = A(6),
        l = function() {
            function t(e) {
                var A = this;
                i(this, t),
                    this.main = e,
                    this.wrapper = e.wrapper.querySelector(".ptro-settings-widget-wrapper"),
                    this.inputPixelSize = e.wrapper.querySelector(".ptro-settings-widget-wrapper .ptro-pixel-size-input"),
                    this.applyButton = e.wrapper.querySelector(".ptro-settings-widget-wrapper button.ptro-apply"),
                    this.closeButton = e.wrapper.querySelector(".ptro-settings-widget-wrapper button.ptro-close"),
                    this.clearButton = e.wrapper.querySelector(".ptro-settings-widget-wrapper button.ptro-clear"),
                    this.bgSelBtn = e.wrapper.querySelector(".ptro-settings-widget-wrapper .ptro-color-btn"),
                    this.errorHolder = e.wrapper.querySelector(".ptro-settings-widget-wrapper .ptro-error"),
                    this.clearButton.onclick = function() {
                        A.main.currentBackground = A.main.colorWidgetState.bg.alphaColor,
                            A.main.currentBackgroundAlpha = A.main.colorWidgetState.bg.alpha,
                            A.main.clearBackground(),
                            A.startClose()
                    },
                    this.bgSelBtn.onclick = function() {
                        A.main.colorPicker.open(A.main.colorWidgetState.bg)
                    },
                    this.closeButton.onclick = function() {
                        A.startClose()
                    },
                    this.applyButton.onclick = function() {
                        var t = (0,
                                a.trim)(A.inputPixelSize.value),
                            e = void 0;
                        if ("%" === t.slice(-1)) {
                            var i = (0,
                                a.trim)(t.slice(0, -1));
                            e = /^\d+$/.test(i) && 0 !== parseInt(i, 10),
                                e && (t = i + "%")
                        } else
                            e = /^\d+$/.test(t) && 0 !== parseInt(t, 10);
                        e ? (A.main.select.pixelizePixelSize = t,
                            (0,
                                n.setParam)("pixelizePixelSize", t),
                            A.startClose(),
                            A.errorHolder.setAttribute("hidden", "")) : (A.errorHolder.innerText = (0,
                                r.tr)("wrongPixelSizeValue"),
                            A.errorHolder.removeAttribute("hidden"))
                    }
            }
            return o(t, [{
                    key: "handleKeyDown",
                    value: function(t) {
                        t.keyCode === a.KEYS.esc && this.startClose()
                    }
                }, {
                    key: "open",
                    value: function() {
                        this.wrapper.removeAttribute("hidden"),
                            this.opened = !0,
                            this.inputPixelSize.value = this.main.select.pixelizePixelSize,
                            this.bgSelBtn.style["background-color"] = this.main.colorWidgetState.bg.alphaColor
                    }
                }, {
                    key: "close",
                    value: function() {
                        this.wrapper.setAttribute("hidden", "true"),
                            this.opened = !1
                    }
                }, {
                    key: "startClose",
                    value: function() {
                        this.errorHolder.setAttribute("hidden", ""),
                            this.main.closeActiveTool()
                    }
                }], [{
                    key: "html",
                    value: function() {
                        return '<div class="ptro-settings-widget-wrapper ptro-common-widget-wrapper ptro-v-middle" hidden><div class="ptro-settings-widget ptro-color-main ptro-v-middle-in"><table style="margin-top: 5px"><tr><td class="ptro-label ptro-resize-table-left" style="height:30px;">' + (0,
                            r.tr)("backgroundColor") + '</td><td class="ptro-strict-cell"><button data-id="bg" class="ptro-color-btn ptro-bordered-btn" style="margin-top: -12px;"></button><span class="ptro-btn-color-checkers"></span></td><td><button style="margin-top: -2px;" class="ptro-named-btn ptro-clear ptro-color-control" title="' + (0,
                            r.tr)("fillPageWith") + '">' + (0,
                            r.tr)("clear") + '</button></td></tr><tr><td class="ptro-label ptro-resize-table-left" >' + (0,
                            r.tr)("pixelizePixelSize") + '</td><td colspan="2"><input class="ptro-input ptro-pixel-size-input" pattern="[0-9]{1,}%?" type="text" /></td></tr></table><div class="ptro-error" hidden></div><div style="margin-top: 20px"><button class="ptro-named-btn ptro-apply ptro-color-control">' + (0,
                            r.tr)("apply") + '</button><button class="ptro-named-btn ptro-close ptro-color-control">' + (0,
                            r.tr)("cancel") + "</button></div></div></div>"
                    }
                }]),
                t
        }();
    e.default = l
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = A(0),
        a = function() {
            function t(e) {
                i(this, t),
                    this.ctx = e.ctx,
                    this.el = e.toolContainer,
                    this.main = e,
                    this.wrapper = e.wrapper,
                    this.input = this.el.querySelector(".ptro-text-tool-input"),
                    this.setFontSize(e.params.defaultFontSize),
                    this.setFontStrokeSize(e.params.fontStrokeSize),
                    this.setFont(t.getFonts()[0].value),
                    this.setFontStyle(t.getFontStyles()[0].value)
            }
            return o(t, [{
                    key: "getFont",
                    value: function() {
                        return this.font
                    }
                }, {
                    key: "getFontStyle",
                    value: function() {
                        return this.fontStyle
                    }
                }, {
                    key: "setFont",
                    value: function(t) {
                        this.font = t,
                            this.input.style["font-family"] = t,
                            this.active && this.input.focus(),
                            this.active && this.reLimit()
                    }
                }, {
                    key: "setFontStyle",
                    value: function(t) {
                        this.fontStyle = t,
                            (0,
                                r.checkIn)("bold", this.fontStyle) ? this.input.style["font-weight"] = "bold" : this.input.style["font-weight"] = "normal",
                            (0,
                                r.checkIn)("italic", this.fontStyle) ? this.input.style["font-style"] = "italic" : this.input.style["font-style"] = "normal",
                            this.active && this.input.focus(),
                            this.active && this.reLimit()
                    }
                }, {
                    key: "setFontSize",
                    value: function(t) {
                        this.fontSize = t,
                            this.input.style["font-size"] = t + "px",
                            this.active && this.reLimit()
                    }
                }, {
                    key: "setFontStrokeSize",
                    value: function(t) {
                        this.fontStrokeSize = t,
                            this.input.style["-webkit-text-stroke"] = this.fontStrokeSize + "px " + this.strokeColor,
                            this.active && this.input.focus(),
                            this.active && this.reLimit()
                    }
                }, {
                    key: "setFontColor",
                    value: function(t) {
                        this.color = t,
                            this.input.style.color = t
                    }
                }, {
                    key: "setStrokeColor",
                    value: function(t) {
                        this.strokeColor = t,
                            this.input.style["-webkit-text-stroke"] = this.fontStrokeSize + "px " + this.strokeColor
                    }
                }, {
                    key: "inputLeft",
                    value: function() {
                        return this.input.documentOffsetLeft + this.main.scroller.scrollLeft
                    }
                }, {
                    key: "inputTop",
                    value: function() {
                        return this.input.documentOffsetTop + this.main.scroller.scrollTop
                    }
                }, {
                    key: "reLimit",
                    value: function() {
                        this.input.style.right = "auto",
                            this.inputLeft() + this.input.clientWidth > this.main.elLeft() + this.el.clientWidth ? this.input.style.right = "0" : this.input.style.right = "auto",
                            this.input.style.bottom = "auto",
                            this.inputTop() + this.input.clientHeight > this.main.elTop() + this.el.clientHeight ? this.input.style.bottom = "0" : this.input.style.bottom = "auto"
                    }
                }, {
                    key: "handleMouseDown",
                    value: function(t) {
                        var e = this;
                        if ("ptro-crp-el" === t.target.classList[0]) {
                            this.active || (this.input.innerHTML = "<br>",
                                    this.pendingClear = !0),
                                this.active = !0,
                                this.crd = [t.clientX - this.main.elLeft() + this.main.scroller.scrollLeft, t.clientY - this.main.elTop() + this.main.scroller.scrollTop];
                            var A = this.main.getScale();
                            this.scaledCord = [this.crd[0] * A, this.crd[1] * A],
                                this.input.style.left = this.crd[0] + "px",
                                this.input.style.top = this.crd[1] + "px",
                                this.input.style.display = "inline",
                                this.input.focus(),
                                this.reLimit(),
                                this.input.onkeydown = function(t) {
                                    t.keyCode !== r.KEYS.enter || e.main.isMobile || (e.apply(),
                                            e.main.closeActiveTool(),
                                            t.preventDefault()),
                                        t.keyCode === r.KEYS.esc && (e.cancel(),
                                            e.main.closeActiveTool(),
                                            t.preventDefault()),
                                        e.reLimit(),
                                        e.pendingClear && (e.input.innerText = e.input.innerText.slice(1),
                                            e.pendingClear = !1)
                                },
                                t.preventDefault()
                        }
                    }
                }, {
                    key: "apply",
                    value: function() {
                        this.ctx.fillStyle = this.color,
                            this.ctx.textAlign = "left",
                            this.ctx.font = this.fontStyle + " " + this.fontSize * this.main.getScale() + "px " + this.font,
                            this.ctx.fillText(this.input.innerText, this.scaledCord[0] + 2, this.scaledCord[1] + .8 * this.input.clientHeight * this.main.getScale()),
                            this.ctx.strokeStyle = this.strokeColor,
                            this.ctx.lineWidth = this.fontStrokeSize,
                            this.fontStrokeSize > 0 && this.ctx.strokeText(this.input.innerText, this.scaledCord[0] + 2, this.scaledCord[1] + .8 * this.input.clientHeight * this.main.getScale()),
                            this.active = !1,
                            this.input.style.display = "none",
                            this.main.worklog.captureState()
                    }
                }, {
                    key: "cancel",
                    value: function() {
                        this.active = !1,
                            this.input.style.display = "none"
                    }
                }], [{
                    key: "getFonts",
                    value: function() {
                        var t = ["Arial, Helvetica, sans-serif", '"Arial Black", Gadget, sans-serif', '"Comic Sans MS", cursive, sans-serif', "Impact, Charcoal, sans-serif", '"Lucida Sans Unicode", "Lucida Grande", sans-serif', "Tahoma, Geneva, sans-serif", '"Trebuchet MS", Helvetica, sans-serif', "Verdana, Geneva, sans-serif", '"Courier New", Courier, monospace', '"Lucida Console", Monaco, monospace'],
                            e = [];
                        return t.forEach(function(t) {
                                e.push({
                                    value: t,
                                    name: "Aa",
                                    extraStyle: "font-family:" + t,
                                    title: t.split(",")[0].replace(/"/g, "")
                                })
                            }),
                            e
                    }
                }, {
                    key: "getFontStyles",
                    value: function() {
                        return [{
                            value: "normal",
                            name: "N",
                            title: "Normal"
                        }, {
                            value: "bold",
                            name: "B",
                            extraStyle: "font-weight: bold",
                            title: "Bold"
                        }, {
                            value: "italic",
                            name: "I",
                            extraStyle: "font-style: italic",
                            title: "Italic"
                        }, {
                            value: "italic bold",
                            name: "BI",
                            extraStyle: "font-weight: bold; font-style: italic",
                            title: "Bold + Italic"
                        }]
                    }
                }, {
                    key: "code",
                    value: function() {
                        return '<span contenteditable="true" class="ptro-text-tool-input" style="display:none"></span>'
                    }
                }]),
                t
        }();
    e.default = a
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = function() {
            function t(e, A) {
                i(this, t),
                    this.main = e,
                    this.current = null,
                    this.changedHandler = A,
                    this.empty = !0,
                    this.clean = !0,
                    this.ctx = e.ctx
            }
            return o(t, [{
                    key: "getWorklogAsString",
                    value: function(t) {
                        var e = Object.assign({}, this.current),
                            A = this.clearedCount;
                        if (void 0 !== t.limit) {
                            var i = t.limit;
                            A = 0;
                            var o = e,
                                r = void 0;
                            for (r = 0; r < i; r += 1)
                                o.prevCount = i - r,
                                r < i - 1 && o.prev && (o = o.prev);
                            o.prev = null
                        }
                        return JSON.stringify({
                            clearedCount: A,
                            current: e
                        })
                    }
                }, {
                    key: "loadWorklogFromString",
                    value: function(t) {
                        var e = JSON.parse(t);
                        return e && (this.clearedCount = e.clearedCount,
                                this.current = e.current,
                                this.applyState(this.current)),
                            this.main
                    }
                }, {
                    key: "changed",
                    value: function(t) {
                        this.current.prevCount - this.clearedCount > this.main.params.worklogLimit && (this.first = this.first.next,
                                this.first.prev = null,
                                this.clearedCount += 1),
                            this.changedHandler({
                                first: null === this.current.prev,
                                last: null === this.current.last,
                                initial: t
                            }),
                            this.empty = t,
                            this.clean = !1
                    }
                }, {
                    key: "captureState",
                    value: function(t) {
                        var e = {
                            sizew: this.main.size.w,
                            sizeh: this.main.size.h,
                            data: this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h)
                        };
                        null === this.current ? (e.prev = null,
                                e.prevCount = 0,
                                this.first = e,
                                this.clearedCount = 0) : (e.prev = this.current,
                                e.prevCount = this.current.prevCount + 1,
                                this.current.next = e),
                            e.next = null,
                            this.current = e,
                            this.changed(t)
                    }
                }, {
                    key: "reCaptureState",
                    value: function() {
                        null !== this.current.prev && (this.current = this.current.prev),
                            this.captureState()
                    }
                }, {
                    key: "applyState",
                    value: function(t) {
                        this.main.resize(t.sizew, t.sizeh),
                            this.main.ctx.putImageData(t.data, 0, 0),
                            this.main.adjustSizeFull(),
                            this.main.select.hide()
                    }
                }, {
                    key: "undoState",
                    value: function() {
                        null !== this.current.prev && (this.current = this.current.prev,
                            this.applyState(this.current),
                            this.changed(!1))
                    }
                }, {
                    key: "redoState",
                    value: function() {
                        null !== this.current.next && (this.current = this.current.next,
                            this.applyState(this.current),
                            this.changed(!1))
                    }
                }]),
                t
        }();
    e.default = r
}, function(t, e, A) {
    "use strict";

    function i(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var o = function() {
            function t(t, e) {
                for (var A = 0; A < e.length; A++) {
                    var i = e[A];
                    i.enumerable = i.enumerable || !1,
                        i.configurable = !0,
                        "value" in i && (i.writable = !0),
                        Object.defineProperty(t, i.key, i)
                }
            }
            return function(e, A, i) {
                return A && t(e.prototype, A),
                    i && t(e, i),
                    e
            }
        }(),
        r = function() {
            function t(e) {
                i(this, t),
                    this.main = e,
                    this.zomer = e.wrapper.querySelector(".ptro-zoomer"),
                    this.zomerCtx = this.zomer.getContext("2d"),
                    this.canvas = this.main.canvas,
                    this.ctx = this.main.ctx,
                    this.wrapper = this.main.wrapper,
                    this.gridColor = this.zomerCtx.createImageData(1, 1),
                    this.gridColor.data[0] = 255,
                    this.gridColor.data[1] = 255,
                    this.gridColor.data[2] = 255,
                    this.gridColor.data[3] = 255,
                    this.gridColorRed = this.zomerCtx.createImageData(1, 1),
                    this.gridColorRed.data[0] = 255,
                    this.gridColorRed.data[1] = 0,
                    this.gridColorRed.data[2] = 0,
                    this.gridColorRed.data[3] = 255,
                    this.captW = 7,
                    this.middle = Math.ceil(this.captW / 2) - 1,
                    this.periodW = 8,
                    this.fullW = this.captW * this.periodW,
                    this.halfFullW = this.fullW / 2,
                    this.zomer.setAttribute("width", this.fullW),
                    this.zomer.setAttribute("height", this.fullW),
                    this.cursor = this.wrapper.style.cursor
            }
            return o(t, [{
                    key: "handleMouseMove",
                    value: function(t) {
                        if (this.main.colorPicker.choosing && !t.altKey) {
                            this.shown || (this.shown = !0,
                                this.zomer.style.display = "block",
                                this.cursor = this.wrapper.style.cursor,
                                this.wrapper.style.cursor = "none");
                            var e = this.main.getScale(),
                                A = [t.clientX - this.main.elLeft() + this.main.scroller.scrollLeft, t.clientY - this.main.elTop() + this.main.scroller.scrollTop],
                                i = A[0] * e;
                            i = i < 1 ? 1 : i,
                                i = i > this.main.size.w - 1 ? this.main.size.w - 1 : i;
                            var o = A[1] * e;
                            o = o < 1 ? 1 : o,
                                o = o > this.main.size.h - 1 ? this.main.size.h - 1 : o;
                            for (var r = this.captW, a = this.periodW, n = 0; n < r; n += 1)
                                for (var l = 0; l < r; l += 1)
                                    for (var s = this.ctx.getImageData(i + n - this.middle, o + l - this.middle, 1, 1), c = 0; c < a; c += 1)
                                        for (var g = 0; g < a; g += 1)
                                            c === a - 1 || g === a - 1 ? n === this.middle && l === this.middle || n === this.middle && l === this.middle - 1 && g === a - 1 || n === this.middle - 1 && l === this.middle && c === a - 1 ? this.zomerCtx.putImageData(this.gridColorRed, n * a + c, l * a + g) : this.zomerCtx.putImageData(this.gridColor, n * a + c, l * a + g) : this.zomerCtx.putImageData(s, n * a + c, l * a + g);
                            this.zomer.style.left = t.clientX - this.wrapper.documentOffsetLeft - this.halfFullW + "px",
                                this.zomer.style.top = t.clientY - this.wrapper.documentOffsetTop - this.halfFullW + "px"
                        } else
                            this.shown && this.hideZoomHelper()
                    }
                }, {
                    key: "hideZoomHelper",
                    value: function() {
                        this.zomer.style.display = "none",
                            this.wrapper.style.cursor = this.cursor,
                            this.shown = !1
                    }
                }], [{
                    key: "html",
                    value: function() {
                        return '<canvas class="ptro-zoomer" width="" height="0"></canvas>'
                    }
                }]),
                t
        }();
    e.default = r
}, function(t, e, A) {
    var i = A(20);
    "string" == typeof i && (i = [
        [t.i, i, ""]
    ]);
    var o = {};
    o.transform = void 0;
    A(4)(i, o);
    i.locals && (t.exports = i.locals)
}, function(t, e, A) {
    var i = A(21);
    "string" == typeof i && (i = [
        [t.i, i, ""]
    ]);
    var o = {};
    o.transform = void 0;
    A(4)(i, o);
    i.locals && (t.exports = i.locals)
}, function(t, e, A) {
    var i = A(22);
    "string" == typeof i && (i = [
        [t.i, i, ""]
    ]);
    var o = {};
    o.transform = void 0;
    A(4)(i, o);
    i.locals && (t.exports = i.locals)
}, function(t, e, A) {
    "use strict";

    function i(t) {
        return t && t.__esModule ? t : {
            default: t
        }
    }

    function o(t, e) {
        if (!(t instanceof e))
            throw new TypeError("Cannot call a class as a function")
    }
    var r = function() {
        function t(t, e) {
            for (var A = 0; A < e.length; A++) {
                var i = e[A];
                i.enumerable = i.enumerable || !1,
                    i.configurable = !0,
                    "value" in i && (i.writable = !0),
                    Object.defineProperty(t, i.key, i)
            }
        }
        return function(e, A, i) {
            return A && t(e.prototype, A),
                i && t(e, i),
                e
        }
    }();
    A(17),
        A(15),
        A(16);
    var a = A(10),
        n = i(a),
        l = A(13),
        s = i(l),
        c = A(0),
        g = A(8),
        h = i(g),
        u = A(5),
        M = i(u),
        p = A(6),
        d = A(1),
        N = A(14),
        D = i(N),
        T = A(12),
        I = i(T),
        w = A(9),
        C = i(w),
        z = A(7),
        k = i(z),
        O = A(11),
        y = i(O),
        f = function() {
            function t(e) {
                var A = this;
                o(this, t),
                    (0,
                        c.addDocumentObjectHelpers)(),
                    this.params = (0,
                        p.setDefaults)(e),
                    this.colorWidgetState = {
                        line: {
                            target: "line",
                            palleteColor: this.params.activeColor,
                            alpha: this.params.activeColorAlpha,
                            alphaColor: this.params.activeAlphaColor
                        },
                        fill: {
                            target: "fill",
                            palleteColor: this.params.activeFillColor,
                            alpha: this.params.activeFillColorAlpha,
                            alphaColor: this.params.activeFillAlphaColor
                        },
                        bg: {
                            target: "bg",
                            palleteColor: this.params.backgroundFillColor,
                            alpha: this.params.backgroundFillColorAlpha,
                            alphaColor: this.params.backgroundFillAlphaColor
                        },
                        stroke: {
                            target: "stroke",
                            palleteColor: this.params.textStrokeColor,
                            alpha: this.params.textStrokeColorAlpha,
                            alphaColor: this.params.textStrokeAlphaColor
                        }
                    },
                    this.currentBackground = this.colorWidgetState.bg.alphaColor,
                    this.currentBackgroundAlpha = this.colorWidgetState.bg.alpha,
                    this.tools = [{
                        name: "select",
                        activate: function() {
                            A.toolContainer.style.cursor = "crosshair",
                                A.select.activate(),
                                A.select.draw()
                        },
                        close: function() {
                            A.select.close(),
                                A.toolContainer.style.cursor = "auto"
                        },
                        eventListner: function() {
                            return A.select
                        }
                    }, {
                        name: "crop",
                        activate: function() {
                            A.select.doCrop(),
                                A.closeActiveTool()
                        }
                    }, {
                        name: "pixelize",
                        activate: function() {
                            A.select.doPixelize(),
                                A.closeActiveTool()
                        }
                    }, {
                        name: "line",
                        controls: [{
                            type: "color",
                            title: "lineColor",
                            target: "line",
                            titleFull: "lineColorFull",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.line)
                            }
                        }, {
                            type: "int",
                            title: "lineWidth",
                            titleFull: "lineWidthFull",
                            target: "lineWidth",
                            min: 1,
                            max: 99,
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[1].id);
                                A.primitiveTool.setLineWidth(t.value),
                                    (0,
                                        p.setParam)("defaultLineWidth", t.value)
                            },
                            getValue: function() {
                                return A.primitiveTool.lineWidth
                            }
                        }],
                        activate: function() {
                            A.toolContainer.style.cursor = "crosshair",
                                A.primitiveTool.activate("line")
                        },
                        eventListner: function() {
                            return A.primitiveTool
                        }
                    }, {
                        name: "rect",
                        controls: [{
                            type: "color",
                            title: "lineColor",
                            titleFull: "lineColorFull",
                            target: "line",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.line)
                            }
                        }, {
                            type: "color",
                            title: "fillColor",
                            titleFull: "fillColorFull",
                            target: "fill",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.fill)
                            }
                        }, {
                            type: "int",
                            title: "lineWidth",
                            titleFull: "lineWidthFull",
                            target: "lineWidth",
                            min: 1,
                            max: 99,
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[2].id).value;
                                A.primitiveTool.setLineWidth(t),
                                    (0,
                                        p.setParam)("defaultLineWidth", t.value)
                            },
                            getValue: function() {
                                return A.primitiveTool.lineWidth
                            }
                        }],
                        activate: function() {
                            A.toolContainer.style.cursor = "crosshair",
                                A.primitiveTool.activate("rect")
                        },
                        eventListner: function() {
                            return A.primitiveTool
                        }
                    }, {
                        name: "ellipse",
                        controls: [{
                            type: "color",
                            title: "lineColor",
                            titleFull: "lineColorFull",
                            target: "line",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.line)
                            }
                        }, {
                            type: "color",
                            title: "fillColor",
                            titleFull: "fillColorFull",
                            target: "fill",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.fill)
                            }
                        }, {
                            type: "int",
                            title: "lineWidth",
                            titleFull: "lineWidthFull",
                            target: "lineWidth",
                            min: 1,
                            max: 99,
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[2].id).value;
                                A.primitiveTool.setLineWidth(t),
                                    (0,
                                        p.setParam)("defaultLineWidth", t.value)
                            },
                            getValue: function() {
                                return A.primitiveTool.lineWidth
                            }
                        }],
                        activate: function() {
                            A.toolContainer.style.cursor = "crosshair",
                                A.primitiveTool.activate("ellipse")
                        },
                        eventListner: function() {
                            return A.primitiveTool
                        }
                    }, {
                        name: "brush",
                        controls: [{
                            type: "color",
                            title: "lineColor",
                            target: "line",
                            titleFull: "lineColorFull",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.line)
                            }
                        }, {
                            type: "int",
                            title: "lineWidth",
                            titleFull: "lineWidthFull",
                            target: "lineWidth",
                            min: 1,
                            max: 99,
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[1].id);
                                A.primitiveTool.setLineWidth(t.value),
                                    (0,
                                        p.setParam)("defaultLineWidth", t.value)
                            },
                            getValue: function() {
                                return A.primitiveTool.lineWidth
                            }
                        }],
                        activate: function() {
                            A.toolContainer.style.cursor = "crosshair",
                                A.primitiveTool.activate("brush")
                        },
                        eventListner: function() {
                            return A.primitiveTool
                        }
                    }, {
                        name: "eraser",
                        controls: [{
                            type: "int",
                            title: "eraserWidth",
                            titleFull: "eraserWidthFull",
                            target: "eraserWidth",
                            min: 1,
                            max: 99,
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[0].id);
                                A.primitiveTool.setEraserWidth(t.value),
                                    (0,
                                        p.setParam)("defaultEraserWidth", t.value)
                            },
                            getValue: function() {
                                return A.primitiveTool.eraserWidth
                            }
                        }],
                        activate: function() {
                            A.toolContainer.style.cursor = "crosshair",
                                A.primitiveTool.activate("eraser")
                        },
                        eventListner: function() {
                            return A.primitiveTool
                        }
                    }, {
                        name: "text",
                        controls: [{
                            type: "color",
                            title: "textColor",
                            titleFull: "textColorFull",
                            target: "line",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.line, function(t) {
                                    A.textTool.setFontColor(t.alphaColor)
                                })
                            }
                        }, {
                            type: "int",
                            title: "fontSize",
                            titleFull: "fontSizeFull",
                            target: "fontSize",
                            min: 1,
                            max: 200,
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[1].id).value;
                                A.textTool.setFontSize(t),
                                    (0,
                                        p.setParam)("defaultFontSize", t)
                            },
                            getValue: function() {
                                return A.textTool.fontSize
                            }
                        }, {
                            type: "dropdown",
                            title: "fontName",
                            titleFull: "fontNameFull",
                            target: "fontName",
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[2].id),
                                    e = t.value;
                                A.textTool.setFont(e)
                            },
                            getValue: function() {
                                return A.textTool.getFont()
                            },
                            getAvilableValues: function() {
                                return I.default.getFonts()
                            }
                        }, {
                            type: "dropdown",
                            title: "fontStyle",
                            titleFull: "fontStyleFull",
                            target: "fontStyle",
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[3].id),
                                    e = t.value;
                                A.textTool.setFontStyle(e)
                            },
                            getValue: function() {
                                return A.textTool.getFontStyle()
                            },
                            getAvilableValues: function() {
                                return I.default.getFontStyles()
                            }
                        }, {
                            type: "int",
                            title: "fontStrokeSize",
                            titleFull: "fontStrokeSizeFull",
                            target: "fontStrokeSize",
                            min: 0,
                            max: 200,
                            action: function() {
                                var t = document.getElementById(A.activeTool.controls[4].id).value;
                                A.textTool.setFontStrokeSize(t),
                                    (0,
                                        p.setParam)("fontStrokeSize", t)
                            },
                            getValue: function() {
                                return A.textTool.fontStrokeSize
                            }
                        }, {
                            type: "color",
                            title: "textStrokeColor",
                            titleFull: "textStrokeColorFull",
                            target: "stroke",
                            action: function() {
                                A.colorPicker.open(A.colorWidgetState.stroke, function(t) {
                                    A.textTool.setStrokeColor(t.alphaColor)
                                })
                            }
                        }, {
                            name: (0,
                                d.tr)("apply"),
                            type: "btn",
                            action: function() {
                                A.textTool.apply(),
                                    A.closeActiveTool()
                            }
                        }],
                        activate: function() {
                            A.textTool.setFontColor(A.colorWidgetState.line.alphaColor),
                                A.textTool.setStrokeColor(A.colorWidgetState.stroke.alphaColor),
                                A.toolContainer.style.cursor = "crosshair"
                        },
                        close: function() {
                            A.textTool.cancel()
                        },
                        eventListner: function() {
                            return A.textTool
                        }
                    }, {
                        name: "rotate",
                        activate: function() {
                            var t = A.size.w,
                                e = A.size.h,
                                i = A.ctx.getImageData(0, 0, A.size.w, A.size.h),
                                o = A.doc.createElement("canvas");
                            o.width = t,
                                o.height = e,
                                o.getContext("2d").putImageData(i, 0, 0),
                                A.resize(e, t),
                                A.ctx.save(),
                                A.ctx.translate(e / 2, t / 2),
                                A.ctx.rotate(90 * Math.PI / 180),
                                A.ctx.drawImage(o, -t / 2, -e / 2),
                                A.adjustSizeFull(),
                                A.ctx.restore(),
                                A.worklog.captureState(),
                                A.closeActiveTool()
                        }
                    }, {
                        name: "resize",
                        activate: function() {
                            A.resizer.open()
                        },
                        close: function() {
                            A.resizer.close()
                        },
                        eventListner: function() {
                            return A.resizer
                        }
                    }, {
                        name: "undo",
                        activate: function() {
                            A.worklog.undoState(),
                                A.closeActiveTool()
                        },
                        eventListner: function() {
                            return A.resizer
                        }
                    }, {
                        name: "settings",
                        activate: function() {
                            A.settings.open()
                        },
                        close: function() {
                            A.settings.close()
                        },
                        eventListner: function() {
                            return A.settings
                        }
                    }, {
                        name: "save",
                        right: !0,
                        activate: function() {
                            A.save(),
                                A.closeActiveTool()
                        }
                    }, {
                        name: "open",
                        right: !0,
                        activate: function() {
                            A.closeActiveTool();
                            var t = document.getElementById("ptro-file-input");
                            t.click(),
                                t.onchange = function(e) {
                                    var i = e.target.files || e.dataTransfer.files;
                                    i.length && (A.openFile(i[0]),
                                        t.value = "")
                                }
                        }
                    }, {
                        name: "close",
                        right: !0,
                        activate: function() {
                            A.closeActiveTool(),
                                A.hide()
                        }
                    }],
                    this.isMobile = (0,
                        c.isMobileOrTablet)(),
                    this.toolByName = {},
                    this.tools.forEach(function(t) {
                        A.toolByName[t.name] = t
                    }),
                    this.activeTool = void 0,
                    this.zoom = !1,
                    this.ratioRelation = void 0,
                    this.id = this.params.id,
                    this.saving = !1,
                    void 0 === this.id ? (this.id = (0,
                            c.genId)(),
                        this.holderId = (0,
                            c.genId)(),
                        this.holderEl = document.createElement("div"),
                        this.holderEl.id = this.holderId,
                        this.holderEl.className = "ptro-holder-wrapper",
                        document.body.appendChild(this.holderEl),
                        this.holderEl.innerHTML = "<div id='" + this.id + '\' class="ptro-holder"></div>',
                        this.baseEl = document.getElementById(this.id)) : (this.baseEl = document.getElementById(this.id),
                        this.holderEl = null);
                var i = "",
                    r = "";
                this.tools.filter(function(t) {
                        return -1 === A.params.hiddenTools.indexOf(t.name)
                    }).forEach(function(t) {
                        var e = (0,
                            c.genId)();
                        t.buttonId = e;
                        var A = '<button class="ptro-icon-btn ptro-color-control" title="' + (0,
                            d.tr)("tools." + t.name) + '" id="' + e + '" ><i class="ptro-icon ptro-icon-' + t.name + '"></i></button>';
                        t.right ? r += A : i += A
                    }),
                    this.inserter = new k.default;
                var a = '<div class="ptro-crp-el">' + n.default.code() + I.default.code() + "</div>";
                this.loadedName = "",
                    this.doc = document,
                    this.wrapper = this.doc.createElement("div"),
                    this.wrapper.id = this.id + "-wrapper",
                    this.wrapper.className = "ptro-wrapper",
                    this.wrapper.innerHTML = '<div class="ptro-scroller"><div class="ptro-center-table"><div class="ptro-center-tablecell"><canvas id="' + this.id + '-canvas"></canvas><div class="ptro-substrate"></div>' + a + "</div></div></div>" + (M.default.html() + D.default.html() + C.default.html() + y.default.html(this) + this.inserter.html()),
                    this.baseEl.appendChild(this.wrapper),
                    this.scroller = this.doc.querySelector("#" + this.id + "-wrapper .ptro-scroller"),
                    this.bar = this.doc.createElement("div"),
                    this.bar.id = this.id + "-bar",
                    this.bar.className = "ptro-bar ptro-color-main",
                    this.bar.innerHTML = "<div><span>" + i + '</span><span class="tool-controls"></span><span class="ptro-bar-right">' + r + '</span><span class="ptro-info"></span><input id="ptro-file-input" type="file" style="display: none;" accept="image/x-png,image/gif,image/jpeg" /></div>',
                    this.isMobile && (this.bar.style["overflow-x"] = "auto"),
                    this.baseEl.appendChild(this.bar);
                var l = this.doc.createElement("style");
                l.type = "text/css",
                    l.innerHTML = this.params.styles,
                    this.baseEl.appendChild(l),
                    this.saveBtn = this.doc.getElementById(this.toolByName.save.buttonId),
                    this.saveBtn && this.saveBtn.setAttribute("disabled", "true"),
                    this.body = this.doc.body,
                    this.info = this.doc.querySelector("#" + this.id + "-bar .ptro-info"),
                    this.canvas = this.doc.querySelector("#" + this.id + "-canvas"),
                    this.ctx = this.canvas.getContext("2d"),
                    this.toolControls = this.doc.querySelector("#" + this.id + "-bar .tool-controls"),
                    this.toolContainer = this.doc.querySelector("#" + this.id + "-wrapper .ptro-crp-el"),
                    this.substrate = this.doc.querySelector("#" + this.id + "-wrapper .ptro-substrate"),
                    this.zoomHelper = new D.default(this),
                    this.select = new n.default(this, function(t) {
                        [A.toolByName.crop, A.toolByName.pixelize].forEach(function(e) {
                            A.setToolEnabled(e, t)
                        })
                    }),
                    this.resizer = new C.default(this),
                    this.settings = new y.default(this),
                    this.primitiveTool = new h.default(this),
                    this.primitiveTool.setLineWidth(this.params.defaultLineWidth),
                    this.primitiveTool.setEraserWidth(this.params.defaultEraserWidth),
                    this.primitiveTool.setPixelSize(this.params.defaultPixelSize),
                    this.worklog = new s.default(this, function(t) {
                        A.saveBtn && !t.initial && A.saveBtn.removeAttribute("disabled"),
                            A.setToolEnabled(A.toolByName.undo, !t.first),
                            A.params.changeHandler && A.params.changeHandler.call(A, {
                                operationsDone: A.worklog.current.prevCount,
                                realesedMemoryOperations: A.worklog.clearedCount
                            })
                    }),
                    this.inserter.init(this),
                    this.textTool = new I.default(this),
                    this.colorPicker = new M.default(this, function(t) {
                        A.colorWidgetState[t.target] = t,
                            A.doc.querySelector("#" + A.id + " .ptro-color-btn[data-id='" + t.target + "']").style["background-color"] = t.alphaColor,
                            "line" === t.target ? ((0,
                                    p.setParam)("activeColor", t.palleteColor),
                                (0,
                                    p.setParam)("activeColorAlpha", t.alpha)) : "fill" === t.target ? ((0,
                                    p.setParam)("activeFillColor", t.palleteColor),
                                (0,
                                    p.setParam)("activeFillColorAlpha", t.alpha)) : "bg" === t.target ? ((0,
                                    p.setParam)("backgroundFillColor", t.palleteColor),
                                (0,
                                    p.setParam)("backgroundFillColorAlpha", t.alpha)) : "stroke" === t.target && ((0,
                                    p.setParam)("textStrokeColor", t.palleteColor),
                                (0,
                                    p.setParam)("textStrokeColorAlpha", t.alpha))
                    }),
                    this.defaultTool = this.toolByName[this.params.defaultTool] || this.toolByName.select,
                    this.tools.filter(function(t) {
                        return -1 === A.params.hiddenTools.indexOf(t.name)
                    }).forEach(function(t) {
                        A.getBtnEl(t).onclick = function() {
                                if (t !== A.defaultTool || A.activeTool !== t) {
                                    var e = A.activeTool;
                                    A.closeActiveTool(!0),
                                        e !== t ? A.setActiveTool(t) : A.setActiveTool(A.defaultTool)
                                }
                            },
                            A.getBtnEl(t).ontouch = A.getBtnEl(t).onclick
                    }),
                    this.setActiveTool(this.defaultTool),
                    this.imageSaver = {
                        asDataURL: function(t, e) {
                            var i = t;
                            return void 0 === i && (i = "image/png"),
                                A.getAsUri(i, e)
                        },
                        asBlob: function(t, e) {
                            var i = t;
                            void 0 === i && (i = "image/png");
                            for (var o = A.getAsUri(i, e), r = atob(o.split(",")[1]), a = new ArrayBuffer(r.length), n = new Uint8Array(a), l = 0; l < r.length; l += 1)
                                n[l] = r.charCodeAt(l);
                            return new Blob([a], {
                                type: i
                            })
                        },
                        suggestedFileName: function(t) {
                            var e = t;
                            return void 0 === e && (e = "png"),
                                (A.loadedName || "image-" + (0,
                                    c.genId)()) + "." + e
                        }
                    },
                    this.initEventHandlers(),
                    this.hide(),
                    this.zoomFactor = 1
            }
            return r(t, [{
                    key: "setToolEnabled",
                    value: function(t, e) {
                        var A = this.doc.getElementById(t.buttonId);
                        A && (e ? A.removeAttribute("disabled") : A.setAttribute("disabled", "true"))
                    }
                }, {
                    key: "getAsUri",
                    value: function(t, e) {
                        var A = e;
                        return void 0 === A && (A = .92),
                            this.canvas.toDataURL(t, A)
                    }
                }, {
                    key: "getBtnEl",
                    value: function(t) {
                        return this.doc.getElementById(t.buttonId)
                    }
                }, {
                    key: "save",
                    value: function() {
                        var t = this;
                        if (this.saving)
                            return this;
                        this.saving = !0;
                        var e = this.doc.getElementById(this.toolByName.save.buttonId),
                            A = this.doc.querySelector("#" + this.toolByName.save.buttonId + " > i");
                        return e && e.setAttribute("disabled", "true"),
                            A && (A.className = "ptro-icon ptro-icon-loading ptro-spinning"),
                            void 0 !== this.params.saveHandler ? this.params.saveHandler(this.imageSaver, function(e) {
                                !0 === e && t.hide(),
                                    A && (A.className = "ptro-icon ptro-icon-save"),
                                    t.saving = !1
                            }) : ((0,
                                    p.logError)("No saveHandler defined, please check documentation"),
                                A && (A.className = "ptro-icon ptro-icon-save"),
                                this.saving = !1),
                            this
                    }
                }, {
                    key: "closeActiveTool",
                    value: function(t) {
                        void 0 !== this.activeTool && (void 0 !== this.activeTool.close && this.activeTool.close(),
                            this.toolControls.innerHTML = "",
                            this.getBtnEl(this.activeTool).className = this.getBtnEl(this.activeTool).className.replace(" ptro-color-active-control", ""),
                            this.activeTool = void 0), !0 !== t && this.setActiveTool(this.defaultTool)
                    }
                }, {
                    key: "handleToolEvent",
                    value: function(t, e) {
                        if (this.activeTool && this.activeTool.eventListner) {
                            var A = this.activeTool.eventListner();
                            A[t] && A[t](e)
                        }
                    }
                }, {
                    key: "initEventHandlers",
                    value: function() {
                        var t = this;
                        this.documentHandlers = {
                                mousedown: function(e) {
                                    t.shown && (t.worklog.empty && (e.target.className.includes("ptro-crp-el") || e.target.className.includes("ptro-icon") || e.target.className.includes("ptro-named-btn")) && t.clearBackground(), !0 !== t.colorPicker.handleMouseDown(e) && t.handleToolEvent("handleMouseDown", e))
                                },
                                touchstart: function(e) {
                                    if (1 === e.touches.length)
                                        e.clientX = e.changedTouches[0].clientX,
                                        e.clientY = e.changedTouches[0].clientY,
                                        t.documentHandlers.mousedown(e);
                                    else if (2 === e.touches.length) {
                                        var A = (0,
                                            c.distance)({
                                            x: e.changedTouches[0].clientX,
                                            y: e.changedTouches[0].clientY
                                        }, {
                                            x: e.changedTouches[1].clientX,
                                            y: e.changedTouches[1].clientY
                                        });
                                        t.lastFingerDist = A
                                    }
                                },
                                touchend: function(e) {
                                    e.clientX = e.changedTouches[0].clientX,
                                        e.clientY = e.changedTouches[0].clientY,
                                        t.documentHandlers.mouseup(e)
                                },
                                touchmove: function(e) {
                                    if (1 === e.touches.length)
                                        e.clientX = e.changedTouches[0].clientX,
                                        e.clientY = e.changedTouches[0].clientY,
                                        t.documentHandlers.mousemove(e);
                                    else if (2 === e.touches.length) {
                                        var A = (0,
                                            c.distance)({
                                            x: e.changedTouches[0].clientX,
                                            y: e.changedTouches[0].clientY
                                        }, {
                                            x: e.changedTouches[1].clientX,
                                            y: e.changedTouches[1].clientY
                                        });
                                        A > t.lastFingerDist ? (e.wheelDelta = 1,
                                                e.ctrlKey = !0,
                                                t.documentHandlers.mousewheel(e)) : A > t.lastFingerDist && (e.wheelDelta = -1,
                                                e.ctrlKey = !0,
                                                t.documentHandlers.mousewheel(e)),
                                            t.lastFingerDist = A,
                                            e.stopPropagation(),
                                            e.preventDefault()
                                    }
                                },
                                mousemove: function(e) {
                                    if (t.shown) {
                                        t.handleToolEvent("handleMouseMove", e),
                                            t.colorPicker.handleMouseMove(e),
                                            t.zoomHelper.handleMouseMove(e),
                                            t.curCord = [e.clientX - t.elLeft() + t.scroller.scrollLeft, e.clientY - t.elTop() + t.scroller.scrollTop];
                                        var A = t.getScale();
                                        t.curCord = [t.curCord[0] * A, t.curCord[1] * A],
                                            "input" !== e.target.tagName.toLowerCase() && e.preventDefault()
                                    }
                                },
                                mouseup: function(e) {
                                    t.shown && (t.handleToolEvent("handleMouseUp", e),
                                        t.colorPicker.handleMouseUp(e))
                                },
                                mousewheel: function(e) {
                                    if (t.shown && e.ctrlKey) {
                                        var A = 1;
                                        t.size.w > t.wrapper.documentClientWidth && (A = Math.min(A, t.wrapper.documentClientWidth / t.size.w)),
                                            t.size.h > t.wrapper.documentClientHeight && (A = Math.min(A, t.wrapper.documentClientHeight / t.size.h)), !t.zoom && t.zoomFactor > A && (t.zoomFactor = A),
                                            t.zoomFactor += .2 * Math.sign(e.wheelDelta),
                                            t.zoomFactor < A ? (t.zoom = !1,
                                                t.zoomFactor = A) : t.zoom = !0,
                                            t.adjustSizeFull(),
                                            t.select.adjustPosition(),
                                            t.zoom && (t.scroller.scrollLeft = t.curCord[0] / t.getScale() - (e.clientX - t.wrapper.documentOffsetLeft),
                                                t.scroller.scrollTop = t.curCord[1] / t.getScale() - (e.clientY - t.wrapper.documentOffsetTop)),
                                            e.preventDefault()
                                    }
                                },
                                keydown: function(e) {
                                    if (t.shown) {
                                        t.colorPicker.handleKeyDown(e);
                                        var A = window.event ? event : e;
                                        t.handleToolEvent("handleKeyDown", A),
                                            A.keyCode === c.KEYS.y && A.ctrlKey || A.keyCode === c.KEYS.z && A.ctrlKey && A.shiftKey ? (t.worklog.redoState(),
                                                e.preventDefault()) : A.keyCode === c.KEYS.z && A.ctrlKey && (t.worklog.undoState(),
                                                e.preventDefault()),
                                            t.saveBtn && A.keyCode === c.KEYS.s && A.ctrlKey && (t.save(),
                                                A.preventDefault())
                                    }
                                },
                                paste: function(e) {
                                    if (t.shown) {
                                        var A = (e.clipboardData || e.originalEvent.clipboardData).items;
                                        Object.keys(A).forEach(function(i) {
                                            var o = A[i];
                                            if ("file" === o.kind && "image" === o.type.split("/")[0])
                                                t.openFile(o.getAsFile());
                                            else if ("string" === o.kind) {
                                                var r = "";
                                                window.clipboardData && window.clipboardData.getData ? r = window.clipboardData.getData("Text") : e.clipboardData && e.clipboardData.getData && (r = e.clipboardData.getData("text/plain")),
                                                    r.startsWith(t.inserter.CLIP_DATA_MARKER) && t.loadImage(localStorage.getItem(t.inserter.CLIP_DATA_MARKER))
                                            }
                                        })
                                    }
                                },
                                dragover: function(e) {
                                    if (t.shown) {
                                        var A = e.target.classList[0];
                                        "ptro-crp-el" !== A && "ptro-bar" !== A || (t.bar.className = "ptro-bar ptro-color-main ptro-bar-dragover"),
                                            e.preventDefault()
                                    }
                                },
                                dragleave: function() {
                                    t.shown && (t.bar.className = "ptro-bar ptro-color-main")
                                },
                                drop: function(e) {
                                    if (t.shown) {
                                        t.bar.className = "ptro-bar ptro-color-main",
                                            e.preventDefault();
                                        var A = e.dataTransfer.files[0];
                                        if (A)
                                            t.openFile(A);
                                        else {
                                            var i = e.dataTransfer.getData("text/html"),
                                                o = /src.*?=['"](.+?)['"]/,
                                                r = o.exec(i);
                                            t.inserter.handleOpen(r[1])
                                        }
                                    }
                                }
                            },
                            this.windowHandlers = {
                                resize: function() {
                                    t.shown && (t.adjustSizeFull(),
                                        t.syncToolElement())
                                }
                            },
                            Object.keys(this.documentHandlers).forEach(function(e) {
                                t.baseEl.addEventListener(e, t.documentHandlers[e])
                            }),
                            Object.keys(this.windowHandlers).forEach(function(e) {
                                window.addEventListener(e, t.windowHandlers[e])
                            })
                    }
                }, {
                    key: "elLeft",
                    value: function() {
                        return this.toolContainer.documentOffsetLeft + this.scroller.scrollLeft
                    }
                }, {
                    key: "elTop",
                    value: function() {
                        return this.toolContainer.documentOffsetTop + this.scroller.scrollTop
                    }
                }, {
                    key: "fitImage",
                    value: function(t) {
                        this.resize(t.naturalWidth, t.naturalHeight),
                            this.ctx.drawImage(t, 0, 0),
                            this.zoomFactor = this.wrapper.documentClientHeight / this.size.h - .2,
                            this.adjustSizeFull(),
                            this.worklog.captureState()
                    }
                }, {
                    key: "loadImage",
                    value: function(t) {
                        this.inserter.handleOpen(t)
                    }
                }, {
                    key: "show",
                    value: function(t) {
                        return this.shown = !0,
                            this.scrollWidth = (0,
                                c.getScrollbarWidth)(),
                            this.isMobile && (this.origOverflowY = this.body.style["overflow-y"],
                                this.body.style["overflow-y"] = "hidden"),
                            this.baseEl.removeAttribute("hidden"),
                            this.holderEl && this.holderEl.removeAttribute("hidden"),
                            "string" == typeof t ? (this.loadedName = (0,
                                    c.trim)((t.substring(t.lastIndexOf("/") + 1) || "").replace(/\..+$/, "")),
                                this.loadImage(t)) : !1 !== t && this.clear(),
                            this
                    }
                }, {
                    key: "hide",
                    value: function() {
                        return this.isMobile && (this.body.style["overflow-y"] = this.origOverflowY),
                            this.shown = !1,
                            this.baseEl.setAttribute("hidden", ""),
                            this.holderEl && this.holderEl.setAttribute("hidden", ""),
                            this
                    }
                }, {
                    key: "openFile",
                    value: function(t) {
                        if (t) {
                            this.loadedName = (0,
                                c.trim)((t.name || "").replace(/\..+$/, ""));
                            var e = URL.createObjectURL(t);
                            this.loadImage(e)
                        }
                    }
                }, {
                    key: "getScale",
                    value: function() {
                        return this.canvas.getAttribute("width") / this.canvas.offsetWidth
                    }
                }, {
                    key: "adjustSizeFull",
                    value: function() {
                        var t = this.wrapper.documentClientWidth / this.wrapper.documentClientHeight;
                        if (!1 === this.zoom)
                            if (this.size.w > this.wrapper.documentClientWidth || this.size.h > this.wrapper.documentClientHeight) {
                                var e = t < this.size.ratio;
                                this.ratioRelation = e,
                                    e ? (this.canvas.style.width = this.wrapper.clientWidth + "px",
                                        this.canvas.style.height = "auto") : (this.canvas.style.width = "auto",
                                        this.canvas.style.height = this.wrapper.clientHeight + "px"),
                                    this.scroller.style.overflow = "hidden"
                            } else
                                this.scroller.style.overflow = "hidden",
                                this.canvas.style.width = "auto",
                                this.canvas.style.height = "auto",
                                this.ratioRelation = 0;
                        else
                            this.scroller.style.overflow = "scroll",
                            this.canvas.style.width = this.size.w * this.zoomFactor + "px",
                            this.canvas.style.height = this.size.h * this.zoomFactor + "px",
                            this.ratioRelation = 0;
                        this.syncToolElement(),
                            this.select.draw()
                    }
                }, {
                    key: "resize",
                    value: function(t, e) {
                        this.info.innerHTML = t + " x " + e,
                            this.size = {
                                w: t,
                                h: e,
                                ratio: t / e
                            },
                            this.canvas.setAttribute("width", this.size.w),
                            this.canvas.setAttribute("height", this.size.h)
                    }
                }, {
                    key: "syncToolElement",
                    value: function() {
                        var t = Math.round(this.canvas.documentClientWidth),
                            e = this.canvas.offsetLeft,
                            A = Math.round(this.canvas.documentClientHeight),
                            i = this.canvas.offsetTop;
                        this.toolContainer.style.left = e + "px",
                            this.toolContainer.style.width = t + "px",
                            this.toolContainer.style.top = i + "px",
                            this.toolContainer.style.height = A + "px",
                            this.substrate.style.left = e + "px",
                            this.substrate.style.width = t + "px",
                            this.substrate.style.top = i + "px",
                            this.substrate.style.height = A + "px"
                    }
                }, {
                    key: "clear",
                    value: function() {
                        var t = "fill" === this.params.defaultSize.width ? this.wrapper.clientWidth : this.params.defaultSize.width,
                            e = "fill" === this.params.defaultSize.height ? this.wrapper.clientHeight : this.params.defaultSize.height;
                        this.resize(t, e),
                            this.clearBackground(),
                            this.worklog.captureState(!0),
                            this.worklog.clean = !0,
                            this.syncToolElement(),
                            this.adjustSizeFull(),
                            this.params.initText && this.worklog.empty && (this.ctx.fillStyle = this.params.initTextColor,
                                this.ctx.textAlign = "center",
                                this.ctx.font = this.params.initTextStyle,
                                this.ctx.lineWidth = 3,
                                this.ctx.strokeStyle = "#fff",
                                this.ctx.strokeText(this.params.initText, this.size.w / 2, this.size.h / 2),
                                this.ctx.fillText(this.params.initText, this.size.w / 2, this.size.h / 2))
                    }
                }, {
                    key: "clearBackground",
                    value: function() {
                        this.ctx.beginPath(),
                            this.ctx.clearRect(0, 0, this.size.w, this.size.h),
                            this.ctx.rect(0, 0, this.size.w, this.size.h),
                            this.ctx.fillStyle = this.currentBackground,
                            this.ctx.fill()
                    }
                }, {
                    key: "setActiveTool",
                    value: function(t) {
                        var e = this;
                        this.activeTool = t,
                            this.getBtnEl(t).className += " ptro-color-active-control";
                        var A = "";
                        (t.controls || []).forEach(function(t) {
                                if (t.id = (0,
                                        c.genId)(),
                                    t.title && (A += '<span class="ptro-tool-ctl-name" title="' + (0,
                                        d.tr)(t.titleFull) + '">' + (0,
                                        d.tr)(t.title) + "</span>"),
                                    "btn" === t.type)
                                    A += "<button " + (t.hint ? 'title="' + (0,
                                        d.tr)(t.hint) + '"' : "") + ' class="ptro-color-control ' + (t.icon ? "ptro-icon-btn" : "ptro-named-btn") + '" id=' + t.id + ">" + (t.icon ? '<i class="ptro-icon ptro-icon-' + t.icon + '"></i>' : "") + "<p>" + (t.name || "") + "</p></button>";
                                else if ("color" === t.type)
                                    A += "<button id=" + t.id + " data-id='" + t.target + "' style=\"background-color: " + e.colorWidgetState[t.target].alphaColor + '" class="color-diwget-btn ptro-color-btn ptro-bordered-btn"></button><span class="ptro-btn-color-checkers-bar"></span>';
                                else if ("int" === t.type)
                                    A += "<input id=" + t.id + ' class="ptro-input" type="number" min="' + t.min + '" max="' + t.max + "\" data-id='" + t.target + "'/>";
                                else if ("dropdown" === t.type) {
                                    var i = "";
                                    t.getAvilableValues().forEach(function(t) {
                                            i += "<option " + (t.extraStyle ? "style='" + t.extraStyle + "'" : "") + " value='" + t.value + "' " + (t.title ? "title='" + t.title + "'" : "") + ">" + t.name + "</option>"
                                        }),
                                        A += "<select id=" + t.id + ' class="ptro-input" data-id=\'' + t.target + "'>" + i + "</select>"
                                }
                            }),
                            this.toolControls.innerHTML = A,
                            (t.controls || []).forEach(function(t) {
                                "int" === t.type ? (e.doc.getElementById(t.id).value = t.getValue(),
                                    e.doc.getElementById(t.id).oninput = t.action) : "dropdown" === t.type ? e.doc.getElementById(t.id).onchange = t.action : e.doc.getElementById(t.id).onclick = t.action
                            }),
                            t.activate()
                    }
                }]),
                t
        }();
    t.exports = function(t) {
        return new f(t)
    }
}, function(t, e, A) {
    "use strict";
    t.exports = function(t) {
        var e = "undefined" != typeof window && window.location;
        if (!e)
            throw new Error("fixUrls requires window.location");
        if (!t || "string" != typeof t)
            return t;
        var A = e.protocol + "//" + e.host,
            i = A + e.pathname.replace(/\/[^\/]*$/, "/");
        return t.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(t, e) {
            var o = e.trim().replace(/^"(.*)"$/, function(t, e) {
                return e
            }).replace(/^'(.*)'$/, function(t, e) {
                return e
            });
            if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(o))
                return t;
            var r;
            return r = 0 === o.indexOf("//") ? o : 0 === o.indexOf("/") ? A + o : i + o.replace(/^\.\//, ""),
                "url(" + JSON.stringify(r) + ")"
        })
    }
}, function(t, e, A) {
    e = t.exports = A(3)(void 0),
        e.push([t.i, ".color-diwget-btn{height:32px;width:32px;cursor:pointer;z-index:1;position:absolute;margin-top:4px}.color-diwget-btn-substrate{display:inline-block;width:32px}.ptro-bar .ptro-tool-ctl-name{padding:0 2px 0 0;line-height:30px;font-family:Open Sans,sans-serif;position:relative;top:-4px;margin-left:5px;border-top-left-radius:10px;border-bottom-left-radius:10px;padding-left:3px;padding-top:4px;padding-bottom:4px}@media screen and (max-width:768px){.ptro-bar>div{white-space:nowrap}span.ptro-bar-right{float:none}span.ptro-info{display:none}}.ptro-bar .ptro-input{height:32px;line-height:32px;font-family:Open Sans,sans-serif;font-size:16px;position:relative;top:-4px;padding-left:2px;padding-right:0}.ptro-bar .ptro-input[type=number]{width:42px}.ptro-bar .ptro-named-btn p{margin:0}.ptro-bar{height:40px;bottom:0;position:absolute;width:100%;font-size:16px;line-height:normal}.ptro-bar .ptro-icon{font-size:20px}button.ptro-icon-right:first-of-type{margin-right:4px}@-webkit-keyframes ptro-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}@keyframes ptro-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}.ptro-spinning{-webkit-animation:ptro-spin .5s infinite steps(9);animation:ptro-spin .8s infinite steps(9);display:inline-block;text-rendering:auto;-webkit-font-smoothing:antialiased}", ""])
}, function(t, e, A) {
    e = t.exports = A(3)(void 0),
        e.push([t.i, "@font-face{font-family:ptroiconfont;src:url(" + A(23) + '?#iefix) format("embedded-opentype"),url(' + A(26) + ') format("woff"),url(' + A(25) + ') format("truetype"),url(' + A(24) + '#ptroiconfont) format("svg");font-weight:400;font-style:normal}.ptro-icon:before{font-family:ptroiconfont!important;font-style:normal!important;font-weight:400!important;font-variant:normal!important;text-transform:none!important;speak:none;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.ptro-icon-0painterro:before{content:"\\F101"}.ptro-icon-apply:before{content:"\\F102"}.ptro-icon-blur:before{content:"\\F103"}.ptro-icon-brush:before{content:"\\F104"}.ptro-icon-close:before{content:"\\F105"}.ptro-icon-crop:before{content:"\\F106"}.ptro-icon-ellipse:before{content:"\\F107"}.ptro-icon-eraser:before{content:"\\F108"}.ptro-icon-line:before{content:"\\F109"}.ptro-icon-linked:before{content:"\\F10A"}.ptro-icon-loading:before{content:"\\F10B"}.ptro-icon-mirror:before{content:"\\F10C"}.ptro-icon-open:before{content:"\\F10D"}.ptro-icon-paste_extend_down:before{content:"\\F10E"}.ptro-icon-paste_extend_right:before{content:"\\F10F"}.ptro-icon-paste_fit:before{content:"\\F110"}.ptro-icon-paste_over:before{content:"\\F111"}.ptro-icon-pipette:before{content:"\\F112"}.ptro-icon-pixelize:before{content:"\\F113"}.ptro-icon-rect:before{content:"\\F114"}.ptro-icon-redo:before{content:"\\F115"}.ptro-icon-resize:before{content:"\\F116"}.ptro-icon-rotate:before{content:"\\F117"}.ptro-icon-save:before{content:"\\F118"}.ptro-icon-select:before{content:"\\F119"}.ptro-icon-settings:before{content:"\\F11A"}.ptro-icon-text:before{content:"\\F11B"}.ptro-icon-undo:before{content:"\\F11C"}.ptro-icon-unlinked:before{content:"\\F11D"}', ""])
}, function(t, e, A) {
    e = t.exports = A(3)(void 0),
        e.push([t.i, '.ptro-wrapper{position:absolute;top:0;bottom:40px;left:0;right:0;text-align:center;z-index:10;font-family:Open Sans,sans-serif}@media screen and (min-width:769px){.ptro-holder{position:fixed;box-shadow:3px 3px 15px #787878;left:35px;right:35px;top:35px;bottom:35px}}@media screen and (max-width:768px){.ptro-holder{position:fixed;box-shadow:3px 3px 15px #787878;left:0;right:0;top:0;bottom:0}}.ptro-holder-wrapper{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.2)}.ptro-wrapper.ptro-v-aligned:before{content:"";display:inline-block;vertical-align:middle;height:100%}.ptro-icon-btn:disabled{color:gray}.ptro-wrapper canvas{display:inline-block;touch-action:none;margin-left:auto;margin-right:auto}.ptro-center-table{display:table;width:100%;height:100%}.ptro-center-tablecell{display:table-cell;vertical-align:middle}.ptro-icon-btn{border:0;padding:4px 0 5px;margin:4px 0 0 4px;height:32px;width:32px;cursor:pointer}.ptro-icon-btn i{line-height:23px}.ptro-named-btn{border:0;display:inline-block;height:30px;margin-left:4px;font-family:Open Sans,sans-serif;position:relative;top:-5px;font-size:14px;cursor:pointer}.color-diwget-btn:focus,.ptro-color-btn:focus,.ptro-icon-btn:focus,.ptro-named-btn:focus,.ptro-selector-btn:focus{outline:none}.ptro-color-btn{height:32px;width:32px;cursor:pointer}.ptro-wrapper .select-handler{background-color:#fff;border:1px solid #000;width:6px;height:6px;position:absolute;z-index:10}.ptro-wrapper .ptro-crp-el{position:absolute}.ptro-wrapper .ptro-substrate{opacity:.3;background-image:url(' + A(2) + ');background-size:32px 32px;z-index:-1;position:absolute}.ptro-wrapper .ptro-close-color-picker{height:24px;float:right;margin-top:5px;margin-bottom:-5px}.ptro-wrapper .ptro-crp-rect{position:absolute;background-color:hsla(0,0%,88%,.5);border:1px dashed #000;cursor:move;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-user-drag:none;user-drag:none;-webkit-touch-callout:none;background-repeat:no-repeat;background-size:100% 100%}.ptro-wrapper .ptro-crp-tl{position:absolute;top:0;left:0;margin:-4px 0 0 -4px;cursor:se-resize}.ptro-wrapper .ptro-crp-bl{position:absolute;left:0;bottom:0;margin:0 0 -4px -4px;cursor:ne-resize}.ptro-wrapper .ptro-crp-br{position:absolute;right:0;bottom:0;margin:0 -4px -4px 0;cursor:se-resize}.ptro-wrapper .ptro-crp-tr{position:absolute;right:0;top:0;margin:-4px -4px 0 0;cursor:ne-resize}.ptro-wrapper .ptro-crp-l{position:absolute;top:50%;left:0;margin:-4px 0 0 -4px;cursor:e-resize}.ptro-wrapper .ptro-crp-t{position:absolute;top:0;left:50%;margin:-4px 0 0 -4px;cursor:s-resize}.ptro-wrapper .ptro-crp-r{position:absolute;top:50%;right:0;margin:-4px -4px 0 0;cursor:e-resize}.ptro-wrapper .ptro-crp-b{position:absolute;left:50%;bottom:0;margin:0 0 -4px -4px;cursor:s-resize}.ptro-bar .ptro-named-btn p,.ptro-bar .ptro-tool-ctl-name,.ptro-bar input,.ptro-wrapper div,.ptro-wrapper i,.ptro-wrapper span{-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-user-drag:none;user-drag:none;-webkit-touch-callout:none}.ptro-info{font-family:Open Sans,sans-serif;font-size:10px;float:right;padding:22px 4px 4px 0}.ptro-wrapper .ptro-common-widget-wrapper{position:absolute;background-color:rgba(0,0,0,.6);top:0;bottom:0;left:0;right:0}.ptro-wrapper .ptro-pallet canvas{cursor:crosshair}div.ptro-pallet{line-height:0}.ptro-wrapper .ptro-pallet,.ptro-wrapper .ptro-resize-widget{width:200px;padding:10px;z-index:100;box-sizing:border-box}.ptro-error{background-color:rgba(200,0,0,.5);padding:5px;margin:5px;color:#fff}.ptro-v-middle:before{content:"";height:100%}.ptro-v-middle-in,.ptro-v-middle:before{display:inline-block;vertical-align:middle}.ptro-v-middle-in{position:relative}.ptro-wrapper .ptro-settings-widget{width:300px;padding:10px;z-index:100;box-sizing:border-box}td.ptro-resize-table-left{text-align:right;padding-right:5px;float:none;font-size:14px}.ptro-wrapper .ptro-color-edit{margin-top:15px}.ptro-wrapper .ptro-color-edit input{float:left;height:24px;text-align:center;font-family:monospace;font-size:14px}.ptro-wrapper .ptro-color-edit input:focus{outline:none}.ptro-wrapper .ptro-color-edit input.ptro-color{width:70px}.ptro-wrapper .ptro-color-edit input.ptro-color-alpha{font-size:14px;width:55px;padding:0 0 0 2px;line-height:23px;height:23px}.ptro-wrapper .ptro-color-alpha-label,.ptro-wrapper .ptro-label{float:left;padding:0 2px 0 0;margin-left:5px;font-family:Open Sans,sans-serif}.ptro-pixel-size-input{width:60px}.ptro-wrapper .ptro-pipette{height:24px;width:24px;margin:0}div.ptro-color-widget-wrapper{z-index:1000}.ptro-wrapper .ptro-pipette i{line-height:16px}.ptro-wrapper .ptro-pipette:active{outline:none}.ptro-wrapper .ptro-color-widget-wrapper .ptro-canvas-alpha,.ptro-wrapper .ptro-color-widget-wrapper .ptro-canvas-light{margin-top:10px}span.ptro-color-alpha-regulator,span.ptro-color-light-regulator{display:block;margin-top:-5px;margin-left:5px;position:absolute;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:5px solid;cursor:crosshair}span.ptro-color-alpha-regulator{margin-top:0}.alpha-checkers{background-image:url(' + A(2) + ");display:block;width:100%;height:15px;background-size:10px 10px;margin-top:-20px}input.ptro-input:focus,select.ptro-input:focus{outline:none;box-shadow:none}input.ptro-input,select.ptro-input{vertical-align:initial;padding-top:0;padding-bottom:0;padding-right:0}.ptro-named-btn p{font-size:inherit;line-height:normal;margin:inherit}.ptro-wrapper .ptro-zoomer{border-top:1px solid #fff;border-left:1px solid #fff;position:absolute;z-index:2000;display:none}.ptro-text-tool-input{position:absolute;background-color:transparent;border:1px dashed;width:auto;display:block;min-width:5px;padding:0 1px;overflow-x:hidden;word-wrap:normal;overflow-y:hidden;box-sizing:content-box;line-height:normal}.ptro-text-tool-input:focus{outline:none}span.ptro-btn-color-checkers{background-image:url(" + A(2) + ");display:block;width:32px;height:32px;background-size:16px 16px;margin-top:-32px}span.ptro-btn-color-checkers-bar{background-image:url(" + A(2) + ');display:inline-block;width:32px;line-height:12px;height:32px;background-size:16px 16px;z-index:0;position:relative;top:6px;left:0;margin-top:-2px}.ptro-bar-right{float:right;margin-right:4px}.ptro-link{float:left;margin-right:-12px;margin-top:-23px}.ptro-resize-link-wrapper{display:inline-block;height:20px}input.ptro-pixel-size-input,input.ptro-resize-heigth-input,input.ptro-resize-width-input{line-height:22px;padding:0 0 0 4px;height:22px}.ptro-selector-btn i{font-size:56px}.ptro-selector-btn{opacity:.8;border:0;width:100px;cursor:pointer;margin:5px}.ptro-selector-btn div{margin:5px 0}.ptro-paster-select .ptro-in div{font-family:Open Sans,sans-serif;font-size:14px}.ptro-selector-btn:hover{opacity:.6}.ptro-paster-select{display:inline-block;margin-left:auto;margin-right:auto;height:100%}.ptro-paster-select .ptro-in{background-color:rgba(0,0,0,.7);padding:10px}.ptro-paster-select-wrapper{position:absolute;top:0;left:0;right:0;bottom:0}.ptro-paste-label{color:#fff;margin-bottom:10px}.ptro-iframe{width:100%;height:100%;border:0}i.mce-i-painterro:before,span.mce_painterro:before{font-size:20px!important;font-family:ptroiconfont!important;font-style:normal!important;font-weight:400!important;font-variant:normal!important;text-transform:none!important;speak:none;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;content:"\\F101"}.ptro-scroller{position:absolute;top:0;left:0;right:0;bottom:0}td.ptro-strict-cell{font-size:8px;line-height:normal}', ""])
}, function(t, e) {
    t.exports = "data:application/vnd.ms-fontobject;base64,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"
}, function(t, e) {
    t.exports = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PiAKPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIiA+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CiAgPGZvbnQgaWQ9InB0cm9pY29uZm9udCIgaG9yaXotYWR2LXg9IjEwMCI+CiAgICA8Zm9udC1mYWNlIGZvbnQtZmFtaWx5PSJwdHJvaWNvbmZvbnQiCiAgICAgIHVuaXRzLXBlci1lbT0iMTAwIiBhc2NlbnQ9IjEwMCIKICAgICAgZGVzY2VudD0iMCIgLz4KICAgIDxtaXNzaW5nLWdseXBoIGhvcml6LWFkdi14PSIwIiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9IjBwYWludGVycm8iCiAgICAgIHVuaWNvZGU9IiYjeEYxMDE7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTQ1IDk3TDQzIDQ4TDU3IDQ4TDU1IDk3ek00MSA0NUw0MC4wMDc4MTIgMzEuMTA5Mzc1QzQwLjAwNzgxMiAzMS4xMDkzNzUgNDMuMDA3ODEyIDMxLjEwOTM3NSA0Ni4wMDc4MTIgMjkuMTA5Mzc1QzQ5LjAwNzgxMiAyNy4xMDkzNzUgNDkuOTk0IDI0Ljk0MzI1IDUwIDI1QzUwIDI1IDUxLjAwNzgxMiAyNy4xMDkzNzUgNTQuMDA3ODEyIDI5LjEwOTM3NUM1Ny4wMDc4MTIgMzEuMTA5Mzc1IDYwLjAwNzgxMiAzMS4xMDkzNzUgNjAuMDA3ODEyIDMxLjEwOTM3NUw1OSA0NXpNMzkuNTM3MTA5IDI4LjQyMTg3NUMzMC40Nzc0ODYgMjguNjQyNzIxIDIzLjM0OTM2MyAxOC41ODMwNCAxNyAxNkMxMS4zMjk3NTcgMTMuOTA2MjY3IDYuOTk5NzA4IDE3IDcuNTgyMDMxMiAyMEM3Ljk5OTcwOCAyMSA3Ljk2MzQ2MDEgMjIuMjgzNjYzIDEyIDIzQzkgMjQuNTM4OTk3IDUuNTQ0MTkxOSAyMy45OTk5MjkgNCAyMS41ODM5ODRDLTEuNDU5MjcxMyAxNC4xMjQ3MTMgMTMuODE5NzU1IDQuNDUzNTY3IDI4IDVDNDMuOTU3NDg4IDYuMTg3ODggNTcuOTE0NTk3IDIxLjA5Mzc0IDQyLjQxMjEwOSAyOC4wMDM5MDZDNDEuNDMyMzA4IDI4LjI2NjQ0MyA0MC40NzQzMTIgMjguMzk5MDI5IDM5LjUzNzEwOSAyOC40MjE4NzV6TTYwLjM2OTE0MSAyOC4yNDYwOTRDNTkuNDMxOTM4IDI4LjIyMzI0NCA1OC40NzM5NDIgMjguMDkwNjYyIDU3LjQ5NDE0MSAyNy44MjgxMjVDNDEuOTkxNjUzIDIwLjkxNzk1OSA1NS45NDg3NjIgNi4wMTIwOTkgNzEuOTA2MjUgNC44MjQyMTlDODYuMDg2NDk1IDQuMjc3Nzg2IDEwMS4zNjU1MiAxMy45NDg5MzIgOTUuOTA2MjUgMjEuNDA4MjAzQzk0LjM2MjA1OCAyMy44MjQxNDggOTAuOTA2MjUgMjQuMzYzMjE2IDg3LjkwNjI1IDIyLjgyNDIxOUM5MS45NDI3OSAyMi4xMDc4ODIgOTEuOTA2NTQyIDIwLjgyNDIxOSA5Mi4zMjQyMTkgMTkuODI0MjE5QzkyLjkwNjU0MiAxNi44MjQyMTkgODguNTc2NDkzIDEzLjczMDQ4NiA4Mi45MDYyNSAxNS44MjQyMTlDNzYuNTU2ODg3IDE4LjQwNzI1OSA2OS40Mjg3NjQgMjguNDY2OTQgNjAuMzY5MTQxIDI4LjI0NjA5NHoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0iYXBwbHkiCiAgICAgIHVuaWNvZGU9IiYjeEYxMDI7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTkuNzk4MjQ2NCA0OS45NzEwNjk5OTk5OTk5TDM5Ljc2OTMwMyAxOS45OTk5Njk5OTk5OTk5TDg5Ljc2OTMwMyA2OS45OTk5OTk5OTk5OTk5TDgwIDc5Ljk5OTk5OTk5OTk5OTlMNDAgMzkuOTk5OTY5OTk5OTk5OUwyMCA1OS45OTk5OTk5OTk5OTk5eiIgLz4KICAgIDxnbHlwaCBnbHlwaC1uYW1lPSJibHVyIgogICAgICB1bmljb2RlPSImI3hGMTAzOyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE0xMi41IDgyLjVMMTIuNSA3Mi41TDEyLjUgMjIuNUwyMi41IDIyLjVMNTAgMjIuNUw1MCAzMi41TDIyLjUgMzIuNUwyMi41IDcyLjVMNTAgNzIuNUw1MCA4Mi41TDIyLjUgODIuNUwxMi41IDgyLjV6IE01NS4wMDAwMDQgODQuOTk5OTlINjAuMDAwMDA0Vjc5Ljk5OTk5SDU1LjAwMDAwNFY4NC45OTk5OXogTTU1LjAwMDAwOCA3NC45OTk5OUg2MC4wMDAwMDhWNjkuOTk5OTlINTUuMDAwMDA4Vjc0Ljk5OTk5eiBNNjUgODQuOTk5OTlINzBWNzkuOTk5OTlINjVWODQuOTk5OTl6IE02NSA3NC45OTk5OUg3MFY2OS45OTk5OUg2NVY3NC45OTk5OXogTTc1IDg0Ljk5OTk5SDgwVjc5Ljk5OTk5SDc1Vjg0Ljk5OTk5eiBNNzUgNzQuOTk5OTlIODBWNjkuOTk5OTlINzVWNzQuOTk5OTl6IE01NC45OTk5OTYgMzQuOTk5OTdINTkuOTk5OTk2VjI5Ljk5OTk3SDU0Ljk5OTk5NlYzNC45OTk5N3ogTTU1LjAwMDAwNCAyNC45OTk5N0g2MC4wMDAwMDRWMTkuOTk5OTdINTUuMDAwMDA0VjI0Ljk5OTk3eiBNNjQuOTk5OTkyIDM0Ljk5OTk3SDY5Ljk5OTk5MlYyOS45OTk5N0g2NC45OTk5OTJWMzQuOTk5OTd6IE02NS4wMDAwMDggMjQuOTk5OTdINzAuMDAwMDA4VjE5Ljk5OTk3SDY1LjAwMDAwOFYyNC45OTk5N3ogTTc0Ljk5OTk5MiAzNC45OTk5N0g3OS45OTk5OTJWMjkuOTk5OTdINzQuOTk5OTkyVjM0Ljk5OTk3eiBNNzQuOTk5OTkyIDI0Ljk5OTk3SDc5Ljk5OTk5MlYxOS45OTk5N0g3NC45OTk5OTJWMjQuOTk5OTd6IE03NS4wMDAwMDggNjQuOTk5OTlIODAuMDAwMDA4VjU5Ljk5OTk5SDc1LjAwMDAwOFY2NC45OTk5OXogTTg1LjAwMDAwOCA2NC45OTk5OUg5MC4wMDAwMDhWNTkuOTk5OTlIODUuMDAwMDA4VjY0Ljk5OTk5eiBNNzUuMDAwMDA4IDU0Ljk5OTk5SDgwLjAwMDAwOFY0OS45OTk5OUg3NS4wMDAwMDhWNTQuOTk5OTl6IE04NS4wMDAwMDggNTQuOTk5OTlIOTAuMDAwMDA4VjQ5Ljk5OTk5SDg1LjAwMDAwOFY1NC45OTk5OXogTTc1LjAwMDAwOCA0NC45OTk5N0g4MC4wMDAwMDhWMzkuOTk5OTdINzUuMDAwMDA4VjQ0Ljk5OTk3eiBNODUuMDAwMDA4IDQ0Ljk5OTk3SDkwLjAwMDAwOFYzOS45OTk5N0g4NS4wMDAwMDhWNDQuOTk5OTd6IE04NS4wMDAwMDggNzQuOTk5OTlIOTAuMDAwMDA4VjY5Ljk5OTk5SDg1LjAwMDAwOFY3NC45OTk5OXogTTg0Ljk5OTk5MiAzNC45OTk5N0g4OS45OTk5OTJWMjkuOTk5OTdIODQuOTk5OTkyVjM0Ljk5OTk3eiBNODUgMjQuOTk5OTdIOTBWMTkuOTk5OTdIODVWMjQuOTk5OTd6IE04NSA4NC45OTk5OUg5MFY3OS45OTk5OUg4NVY4NC45OTk5OXoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0iYnJ1c2giCiAgICAgIHVuaWNvZGU9IiYjeEYxMDQ7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTc5LjM5MjU4IDkwTDU4LjE3NzczNSA2OC43ODcxMUw1MS4xMDc0MjIgNzUuODU3NDJMNDQuMDM3MTEgNjguNzg1MTZMNTEuMTA3NDIyIDYxLjcxNDg4TDYxLjcxNDg0NCA1MS4xMDcyN0w2OC43ODUxNTcgNDQuMDM2OTdMNzUuODU3NDIgNTEuMTA3MjdMNjguNzg3MTEgNTguMTc3NzhMOTAgNzkuMzkyNThMNzkuMzkyNTggOTB6TTQwLjUwMTk1NCA2NC43OTI5N0M0MC41MDE5NTQgNjQuNzkyOTcgMjUuOTAxMjY0IDUyLjgzMjQ4IDExLjg5MjU3OSA1Mi4yMzA0N0MxMS42NDA5NjggNTIuMjE5NDcgOS43MDMxMjYgNTIuMzcxMDggOS43MDMxMjYgNTIuMzcxMDhDMTMuMjM4NjU5IDM0LjY5MzI3IDM1Ljg0MjYyMiAxMi4wNTg4NyA1MS4xOTkyMTkgMTIuMjczMzdDNTEuMzc2OTMgMTIuMjczMzcgNTEuODE5NjI5IDEyLjg2MzM3IDUxLjk0OTIxOSAxMi45OTAxN0M2NS4yNTA2MzIgMjYuMDY0MDcgNjQuODU5Mzc2IDQwLjM5MDU3IDY0Ljg1OTM3NiA0MC4zOTA1N0w0MC41MDE5NTQgNjQuNzkyOTd6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9ImNsb3NlIgogICAgICB1bmljb2RlPSImI3hGMTA1OyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE01MCA5Ny41QTQ3LjQ5OTk5OSA0Ny41MDAwMDcgMCAwIDEgMi41IDQ5Ljk5OTk3QTQ3LjQ5OTk5OSA0Ny41MDAwMDcgMCAwIDEgNTAgMi40OTk5N0E0Ny40OTk5OTkgNDcuNTAwMDA3IDAgMCAxIDk3LjUgNDkuOTk5OTdBNDcuNDk5OTk5IDQ3LjUwMDAwNyAwIDAgMSA1MCA5Ny41ek01MCA4Ni4zMjQyQTM2LjMyMzUyNyAzNi4zMjM1MzQgMCAwIDAgODYuMzI0MjIgNDkuOTk5OTdBMzYuMzIzNTI3IDM2LjMyMzUzNCAwIDAgMCA1MCAxMy42NzU3Njk5OTk5OTk5QTM2LjMyMzUyNyAzNi4zMjM1MzQgMCAwIDAgMTMuNjc1NzgxIDQ5Ljk5OTk3QTM2LjMyMzUyNyAzNi4zMjM1MzQgMCAwIDAgNTAgODYuMzI0MnpNMzUgNzVMMjUgNjVMNDAgNDkuOTk5OTdMMjUgMzQuOTk5OTdMMzUgMjQuOTk5OTdMNTAgMzkuOTk5OTdMNjUgMjQuOTk5OTdMNzUgMzQuOTk5OTdMNjAgNDkuOTk5OTdMNzUgNjVMNjUgNzVMNTAgNjBMMzUgNzV6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9ImNyb3AiCiAgICAgIHVuaWNvZGU9IiYjeEYxMDY7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTY3LjUgOTIuNUw2Ny41IDc3LjVMMzIuNSA3Ny41TDIyLjUgNzcuNUwyMi41IDY3LjVMMjIuNSAzMi41TDcuNSAzMi41TDcuNSAyMi41TDIyLjUgMjIuNUwyMi41IDcuNUwzMi41IDcuNUwzMi41IDIyLjVMNzcuNSAyMi41TDc3LjUgMzIuNUw3Ny41IDY3LjVMOTIuNSA2Ny41TDkyLjUgNzcuNUw3Ny41IDc3LjVMNzcuNSA5Mi41TDY3LjUgOTIuNXpNMzIuNSA2Ny41TDY3LjUgNjcuNUw2Ny41IDMyLjVMMzIuNSAzMi41TDMyLjUgNjcuNXoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0iZWxsaXBzZSIKICAgICAgdW5pY29kZT0iJiN4RjEwNzsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNNTAgODcuNUEzNy40OTk5OTkgMzcuNDk5OTcxIDAgMCAxIDEyLjUgNDkuOTk5OTdBMzcuNDk5OTk5IDM3LjQ5OTk3MSAwIDAgMSA1MCAxMi40OTk5N0EzNy40OTk5OTkgMzcuNDk5OTcxIDAgMCAxIDg3LjUgNDkuOTk5OTdBMzcuNDk5OTk5IDM3LjQ5OTk3MSAwIDAgMSA1MCA4Ny41ek01MCA3OC42NzU3OEEyOC42NzY0Njg5OTk5OTk5OTcgMjguNjc2NDQ3OTk5OTk5OTk3IDAgMCAwIDc4LjY3NTc4IDQ5Ljk5OTk3QTI4LjY3NjQ2ODk5OTk5OTk5NyAyOC42NzY0NDc5OTk5OTk5OTcgMCAwIDAgNTAgMjEuMzI0MTdBMjguNjc2NDY4OTk5OTk5OTk3IDI4LjY3NjQ0Nzk5OTk5OTk5NyAwIDAgMCAyMS4zMjQyMTkgNDkuOTk5OTdBMjguNjc2NDY4OTk5OTk5OTk3IDI4LjY3NjQ0Nzk5OTk5OTk5NyAwIDAgMCA1MCA3OC42NzU3OHoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0iZXJhc2VyIgogICAgICB1bmljb2RlPSImI3hGMTA4OyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE01Mi45NDc4MTQgNi40NDMzNzAwMDAwMDAxQTMuNzQ0MjY5OSA0LjQ0NDQxNyAwIDAgMSA1Ni4zNzY5MjQgOS4xMDE1NzAwMDAwMDAxTDg0LjY4NTA5NCA4NS43MTQ4NTAwMDAwMDAxQTMuNzQ0MjY5OSA0LjQ0NDQxNyAwIDAgMSA4MS4yNTU5OTQgOTEuOTQzMzUwMDAwMDAwMUw0Ny4wNTIyMTQgOTEuOTQzMzUwMDAwMDAwMUEzLjc0NDI2OTkgNC40NDQ0MTcgMCAwIDEgNDMuNjI0NzE0IDg5LjI4NTE1MDAwMDAwMDFMMTUuMzE0OTE0IDEyLjY3MTg3MDAwMDAwMDFBMy43NDQyNjk5IDQuNDQ0NDE3IDAgMCAxIDE4Ljc0NDAxNCA2LjQ0MzM3MDAwMDAwMDFMNTIuOTQ3ODE0IDYuNDQzMzcwMDAwMDAwMXpNNjMuNDE5NDA0IDUwLjI4NzE3MDAwMDAwMDFMMzcuMzkxODE0IDUwLjI4NzE3MDAwMDAwMDFMNDkuNDk5MDE0IDgzLjA1NDY1MDAwMDAwMDFMNzUuNTI2NTY0IDgzLjA1NDY1MDAwMDAwMDFMNjMuNDE5NDA0IDUwLjI4NzE3MDAwMDAwMDF6IE0yOS42MTg5NzMgNDguMDk5NDdMNzAuMjE4OTggNDguMDk5NDciIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0ibGluZSIKICAgICAgdW5pY29kZT0iJiN4RjEwOTsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNODMuNTg3ODkxIDkzLjE1ODIwMzFMOS4zNDE3OTY5IDE4LjkxMjEwOUwxNi40MTIxMDkgMTEuODQxNzk3TDkwLjY1ODIwMyA4Ni4wODc4OTFMODMuNTg3ODkxIDkzLjE1ODIwMzF6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9ImxpbmtlZCIKICAgICAgdW5pY29kZT0iJiN4RjEwQTsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNNDEuOTc2NTYyIDk1LjMwNjY0MDZMMjkuOTUxMTcyIDg0LjY5MzM1OUwyOS45NTExNzIgNjguNzczNDM4MDAwMDAwMUw0MSA1N0w0MiA1N0w0MiA2Mkw0MiA2NEwzNS45NjI4OTEgNzAuNTQyOTY5TDM1Ljk2Mjg5MSA4Mi45MjM4MjhMNDMuOTgwNDY5IDkwTDU0IDkwTDYyLjAxNTYyNSA4Mi45MjM4MjhMNjIuMDE1NjI1IDcwLjU0Mjk2OUw1NiA2NEw1NiA1N0w1NyA1N0w2OC4wMjkyOTcgNjguNzczNDM4MDAwMDAwMUw2OC4wMjkyOTcgODQuNjkzMzU5TDU2LjAwMzkwNiA5NS4zMDY2NDA2TDQxLjk3NjU2MiA5NS4zMDY2NDA2ek00NS41NDY4NzUgNzAuMDM1MTU2TDQ1LjU0Njg3NSAzMC42MjY5NTNMNTIuNDUzMTI1IDMwLjYyNjk1M0w1Mi40NTMxMjUgNzAuMDM1MTU2TDQ1LjU0Njg3NSA3MC4wMzUxNTZ6TTQxIDQzTDI5Ljk1MTE3MiAzMS4yMjY1NjE5OTk5OTk5TDI5Ljk1MTE3MiAxNS4zMDY2NDFMNDEuOTc2NTYyIDQuNjkzMzU5TDU2LjAwMzkwNiA0LjY5MzM1OUw2OC4wMjkyOTcgMTUuMzA2NjQxTDY4LjAyOTI5NyAzMS4yMjY1NjE5OTk5OTk5TDU3IDQzTDU2IDQzTDU2IDM2TDYyLjAxNTYyNSAyOS40NTcwMzFMNjIuMDE1NjI1IDE3LjA3NjE3Mkw1NCAxMEw0My45ODA0NjkgMTBMMzUuOTYyODkxIDE3LjA3NjE3MkwzNS45NjI4OTEgMjkuNDU3MDMxTDQyIDM2TDQyIDM4TDQyIDQzTDQxIDQzeiIgLz4KICAgIDxnbHlwaCBnbHlwaC1uYW1lPSJsb2FkaW5nIgogICAgICB1bmljb2RlPSImI3hGMTBCOyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE04MCA0OS45OTk5N0M4MCA0NC40NzcxMjI1MDE2OTIxIDg0LjQ3NzE1MjUwMTY5MjEgMzkuOTk5OTcgOTAgMzkuOTk5OTdDOTUuNTIyODQ3NDk4MzA3OSAzOS45OTk5NyAxMDAgNDQuNDc3MTIyNTAxNjkyMSAxMDAgNDkuOTk5OTdDMTAwIDU1LjUyMjgxNzQ5ODMwNzkgOTUuNTIyODQ3NDk4MzA3OSA1OS45OTk5NyA5MCA1OS45OTk5N0M4NC40NzcxNTI1MDE2OTIxIDU5Ljk5OTk3IDgwIDU1LjUyMjgxNzQ5ODMwNzkgODAgNDkuOTk5OTd6IE02OS4yODQyNzEgNzguMjg0Mjg5OTk5OTk5OUM2OS4yODQyNzEgNzMuMzEzNzI1NjQ5ODk3IDczLjMxMzcwODI1MTUyMjkgNjkuMjg0Mjg3MDk5OTk5OSA3OC4yODQyNzEgNjkuMjg0Mjg3MDk5OTk5OUM4My4yNTQ4MzM3NDg0NzcxIDY5LjI4NDI4NzA5OTk5OTkgODcuMjg0MjcxIDczLjMxMzcyNTY0OTg5NyA4Ny4yODQyNzEgNzguMjg0Mjg5OTk5OTk5OUM4Ny4yODQyNzEgODMuMjU0ODU0MzUwMTAyOSA4My4yNTQ4MzM3NDg0NzcxIDg3LjI4NDI5MjkgNzguMjg0MjcxIDg3LjI4NDI5MjlDNzMuMzEzNzA4MjUxNTIyOSA4Ny4yODQyOTI5IDY5LjI4NDI3MSA4My4yNTQ4NTQzNTAxMDI5IDY5LjI4NDI3MSA3OC4yODQyODk5OTk5OTk5eiBNNDIgOTAuNDk5OTlDNDIgODYuMDgxNzA5OTAyNjcxNiA0NS41ODE3MjIwMDEzNTM3IDgyLjQ5OTk4NjIwMDAwMDEgNTAgODIuNDk5OTg2MjAwMDAwMUM1NC40MTgyNzc5OTg2NDYzIDgyLjQ5OTk4NjIwMDAwMDEgNTggODYuMDgxNzA5OTAyNjcxNiA1OCA5MC40OTk5OUM1OCA5NC45MTgyNzAwOTczMjg1IDU0LjQxODI3Nzk5ODY0NjMgOTguNDk5OTkzOCA1MCA5OC40OTk5OTM4QzQ1LjU4MTcyMjAwMTM1MzcgOTguNDk5OTkzOCA0MiA5NC45MTgyNzAwOTczMjg1IDQyIDkwLjQ5OTk5eiBNMTQuNzE1NzI3IDc4LjI4NDI4OTk5OTk5OTlDMTQuNzE1NzI3IDc0LjQxODI5ODA3NjY2NzggMTcuODQ5NzMzNzUxMTg0NCA3MS4yODQyOTIzOTk5OTk5IDIxLjcxNTcyNyA3MS4yODQyOTIzOTk5OTk5QzI1LjU4MTcyMDI0ODgxNTYgNzEuMjg0MjkyMzk5OTk5OSAyOC43MTU3MjcgNzQuNDE4Mjk4MDc2NjY3OCAyOC43MTU3MjcgNzguMjg0Mjg5OTk5OTk5OUMyOC43MTU3MjcgODIuMTUwMjgxOTIzMzMyMSAyNS41ODE3MjAyNDg4MTU2IDg1LjI4NDI4NzYgMjEuNzE1NzI3IDg1LjI4NDI4NzZDMTcuODQ5NzMzNzUxMTg0NCA4NS4yODQyODc2IDE0LjcxNTcyNyA4Mi4xNTAyODE5MjMzMzIxIDE0LjcxNTcyNyA3OC4yODQyODk5OTk5OTk5eiBNNCA0OS45OTk5N0M0IDQ2LjY4NjI2MzU5OTY5NzIgNi42ODYyOTE1MDEwMTUyIDQzLjk5OTk3Mzc5OTk5OTkgMTAgNDMuOTk5OTczNzk5OTk5OUMxMy4zMTM3MDg0OTg5ODQ4IDQzLjk5OTk3Mzc5OTk5OTkgMTYgNDYuNjg2MjYzNTk5Njk3MiAxNiA0OS45OTk5N0MxNiA1My4zMTM2NzY0MDAzMDI3IDEzLjMxMzcwODQ5ODk4NDggNTUuOTk5OTY2MiAxMCA1NS45OTk5NjYyQzYuNjg2MjkxNTAxMDE1MiA1NS45OTk5NjYyIDQgNTMuMzEzNjc2NDAwMzAyNyA0IDQ5Ljk5OTk3eiBNMTYuNzE1NzM2IDIxLjcxNTY2OTk5OTk5OTlDMTYuNzE1NzM2IDE4Ljk1NDI0NDkyNTM2MjYgMTguOTU0MzEyMjUwODQ2IDE2LjcxNTY2NzU5OTk5OTggMjEuNzE1NzM2IDE2LjcxNTY2NzU5OTk5OThDMjQuNDc3MTU5NzQ5MTU0IDE2LjcxNTY2NzU5OTk5OTggMjYuNzE1NzM2IDE4Ljk1NDI0NDkyNTM2MjYgMjYuNzE1NzM2IDIxLjcxNTY2OTk5OTk5OTlDMjYuNzE1NzM2IDI0LjQ3NzA5NTA3NDYzNzMgMjQuNDc3MTU5NzQ5MTU0IDI2LjcxNTY3MjQgMjEuNzE1NzM2IDI2LjcxNTY3MjRDMTguOTU0MzEyMjUwODQ2IDI2LjcxNTY3MjQgMTYuNzE1NzM2IDI0LjQ3NzA5NTA3NDYzNzMgMTYuNzE1NzM2IDIxLjcxNTY2OTk5OTk5OTl6IE00NSA5Ljk5OTk3QzQ1IDcuMjM4NTQ0OTI1MzYyNiA0Ny4yMzg1NzYyNTA4NDYgNC45OTk5Njc1OTk5OTk5IDUwIDQuOTk5OTY3NTk5OTk5OUM1Mi43NjE0MjM3NDkxNTQgNC45OTk5Njc1OTk5OTk5IDU1IDcuMjM4NTQ0OTI1MzYyNiA1NSA5Ljk5OTk3QzU1IDEyLjc2MTM5NTA3NDYzNzMgNTIuNzYxNDIzNzQ5MTU0IDE0Ljk5OTk3MjQgNTAgMTQuOTk5OTcyNEM0Ny4yMzg1NzYyNTA4NDYgMTQuOTk5OTcyNCA0NSAxMi43NjEzOTUwNzQ2MzczIDQ1IDkuOTk5OTd6IE03My4yODQyNjQgMjEuNzE1NjY5OTk5OTk5OUM3My4yODQyNjQgMTguOTU0MjQ0OTI1MzYyNiA3NS41MjI4NDAyNTA4NDYgMTYuNzE1NjY3NTk5OTk5OCA3OC4yODQyNjQgMTYuNzE1NjY3NTk5OTk5OEM4MS4wNDU2ODc3NDkxNTQgMTYuNzE1NjY3NTk5OTk5OCA4My4yODQyNjQgMTguOTU0MjQ0OTI1MzYyNiA4My4yODQyNjQgMjEuNzE1NjY5OTk5OTk5OUM4My4yODQyNjQgMjQuNDc3MDk1MDc0NjM3MyA4MS4wNDU2ODc3NDkxNTQgMjYuNzE1NjcyNCA3OC4yODQyNjQgMjYuNzE1NjcyNEM3NS41MjI4NDAyNTA4NDYgMjYuNzE1NjcyNCA3My4yODQyNjQgMjQuNDc3MDk1MDc0NjM3MyA3My4yODQyNjQgMjEuNzE1NjY5OTk5OTk5OXoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0ibWlycm9yIgogICAgICB1bmljb2RlPSImI3hGMTBDOyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE0xMi41IDEwMEw2LjkwMTU0OTE4MDgzMzIgMTAwLjgxMDc3MDI2NjcwMzlMMTguNDg0NjAwNjkwNTc4NiA5MS45ODg0NzM2NDI2NjE3TDEzLjMxMDc3MDI2NjcwMzkgMTA1LjU5ODQ1MDgxOTE2NjhMMTIuNSAxMDB6IE00NSA5Mi41TDE1IDcuNUw0NSA3LjVMNDUgOTIuNXpNNTYgOTIuNUw1NiA3LjVMODYgNy41TDU2IDkyLjV6TTYwLjUgNjZMNzguNSAxMkw2MC41IDEyTDYwLjUgNjZ6TTYzLjUgNDhMNjMuNSAxNUw3NC41IDE1TDYzLjUgNDh6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9Im9wZW4iCiAgICAgIHVuaWNvZGU9IiYjeEYxMEQ7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTEzLjA3MDMxMiA4Ny40OTk5OUw4LjE5OTIxODUgNzguMzUzNDRMOC4xOTkyMTg1IDI4LjA0ODI3TDIyLjgxNDQ1MyA2OS4yMDY4N0w3NC40NTg5ODQgNjkuMjA2ODdMNzQuNDU4OTg0IDc4LjM1MzQ0TDQyLjMwMjczNCA3OC4zNTM0NEwzNy40MzE2NDEgODcuNDk5OTlMMTMuMDcwMzEyIDg3LjQ5OTk5ek05MiA2MC4wNjAzMUwzMC4zNjcxODggNjAuMDQ5ODFMMTIuMTExMzI4IDEyLjUxMDM3TDc0LjQ1ODk4NCAxMi41MDAzN0w5MiA2MC4wNjAzMXoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0icGFzdGVfZXh0ZW5kX2Rvd24iCiAgICAgIHVuaWNvZGU9IiYjeEYxMEU7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTUgOTVMNSA1NUw4Ljc1MTk1MzEgNTVMOTUgNTVMOTUgOTVMNSA5NXpNMTIuNTAzOTA2IDg3LjQ5NjA5NEw4Ny40OTYwOTQgODcuNDk2MDk0TDg3LjQ5NjA5NCA2Mi41MDE5NTNMMTIuNTAzOTA2IDYyLjUwMTk1M0wxMi41MDM5MDYgODcuNDk2MDk0ek0zNi4yMTA5MzggNTAuMDU2NjQxTDM2LjIxMDkzOCA0Ni4yMzA0NjlMMzYuMjEwOTM4IDM0LjU0Njg3NUwxNC41NTY2NDEgMzQuNTQ2ODc1TDUwLjA0Mjk2OSA0Ljg1NzQyMkw4NS40MTc5NjkgMzQuNTQ2ODc1TDYzLjc4OTA2MiAzNC41NDY4NzVMNjMuNzg5MDYyIDUwLjA1NjY0MUwzNi4yMTA5MzggNTAuMDU2NjQxek00My44NTkzNzUgNDIuNDA2MjVMNTYuMTQwNjI1IDQyLjQwNjI1TDU2LjE0MDYyNSAyNi44OTY0ODRMNjQuNDA0Mjk3IDI2Ljg5NjQ4NEw1MC4wMzUxNTYgMTQuODM3ODkxTDM1LjYyMTA5NCAyNi44OTY0ODRMNDMuODU5Mzc1IDI2Ljg5NjQ4NEw0My44NTkzNzUgNDIuNDA2MjV6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9InBhc3RlX2V4dGVuZF9yaWdodCIKICAgICAgdW5pY29kZT0iJiN4RjEwRjsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNNS41NDg4MjgxIDk1LjU0Njg3NUw1LjU0ODgyODEgNS41NDY4NzVMOS4yOTg4MjgxIDUuNTQ2ODc1TDQ1LjU0Njg3NSA1LjU0Njg3NUw0NS41NDY4NzUgOTUuNTQ2ODc1TDUuNTQ4ODI4MSA5NS41NDY4NzV6TTEzLjA1MDc4MSA4OC4wNDI5NjlMMzguMDQ0OTIyIDg4LjA0Mjk2OUwzOC4wNDQ5MjIgMTMuMDUwNzgxTDEzLjA1MDc4MSAxMy4wNTA3ODFMMTMuMDUwNzgxIDg4LjA0Mjk2OXpNNjYuMDc0MjE5IDg1Ljc2NTYyNUw2Ni4wNzQyMTkgNjQuMjYzNjcyTDUwLjU2NDQ1MyA2NC4yNjM2NzJMNTAuNTY0NDUzIDM2LjgzMDA3OEw1NC4zMTY0MDYgMzYuODMwMDc4TDY2LjA3NDIxOSAzNi44MzAwNzhMNjYuMDc0MjE5IDE1LjMwNDY4ODAwMDAwMDFMOTUuNTk1NzAzIDUwLjU4OTg0NEw2Ni4wNzQyMTkgODUuNzY1NjI1ek03My41NzYxNzIgNjUuMTUyMzQ0TDg1LjgwNDY4OCA1MC41ODIwMzFMNzMuNTc2MTcyIDM1Ljk2Njc5N0w3My41NzYxNzIgNDQuMzMzOTg0TDU4LjA2NjQwNiA0NC4zMzM5ODRMNTguMDY2NDA2IDU2Ljc1OTc2Nkw3My41NzYxNzIgNTYuNzU5NzY2TDczLjU3NjE3MiA2NS4xNTIzNDR6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9InBhc3RlX2ZpdCIKICAgICAgdW5pY29kZT0iJiN4RjExMDsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNNSA5NUw1IDkxLjI4NTE1NjJMNSA1TDk1IDVMOTUgOTVMNSA5NXpNMTIuNDI5Njg4IDg3LjU3MDMxMkw4Ny41NzAzMTIgODcuNTcwMzEyTDg3LjU3MDMxMiAxMi40Mjk2ODgwMDAwMDAxTDEyLjQyOTY4OCAxMi40Mjk2ODgwMDAwMDAxTDEyLjQyOTY4OCA4Ny41NzAzMTJ6TTgwIDgwTDUzLjM2NTIzNCA3My41NTY2NDFMNjYuODI0MjE5IDcwLjE5MTQwNkw1MCA2MC4wOTU3MDNMNjAuMDkzNzUgNTBMNzAuMTg5NDUzIDY2LjgyNjE3Mkw3My41NTQ2ODggNTMuMzY1MjM0TDgwIDgwek00MC4wOTM3NSA1MEwzMC4xODU1NDcgMzMuNDkwMjM0TDI2Ljg4MjgxMiA0Ni42OTcyNjZMMjAgMjBMNDYuNjk3MjY2IDI2Ljg4NDc2NkwzMy40ODgyODEgMzAuMTg3NUw1MCA0MC4wOTM3NUw0MC4wOTM3NSA1MHoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0icGFzdGVfb3ZlciIKICAgICAgdW5pY29kZT0iJiN4RjExMTsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNNTAgOTVMMzUgODEuNjY2MDE2TDQyLjUgODEuNjY2MDE2TDQyLjUgNzVMNTcuNSA3NUw1Ny41IDgxLjY2NjAxNkw2NSA4MS42NjYwMTZMNTAgOTV6TTMwIDcwTDMwIDMwTDMyLjk3MDcwMyAzMEw2NS44NzEwOTQgMzBMNzAgMzBMNzAgNzBMMzAgNzB6TTE4LjMzMzk4NCA2NUw1IDUwTDE4LjMzMzk4NCAzNUwxOC4zMzM5ODQgNDIuNUwyNSA0Mi41TDI1IDU3LjVMMTguMzMzOTg0IDU3LjVMMTguMzMzOTg0IDY1ek04MS42NjYwMTYgNjVMODEuNjY2MDE2IDU3LjVMNzUgNTcuNUw3NSA0Mi41TDgxLjY2NjAxNiA0Mi41TDgxLjY2NjAxNiAzNUw5NSA1MEw4MS42NjYwMTYgNjV6TTM1LjkzOTQ1MyA2NC4wNTg1OTRMNjQuMDYwNTQ3IDY0LjA1ODU5NEw2NC4wNjA1NDcgMzUuOTM5NDUzTDM1LjkzOTQ1MyAzNS45Mzk0NTNMMzUuOTM5NDUzIDY0LjA1ODU5NHpNNDIuNSAyNUw0Mi41IDE4LjMzMzk4NEwzNSAxOC4zMzM5ODRMNTAgNUw2NSAxOC4zMzM5ODRMNTcuNSAxOC4zMzM5ODRMNTcuNSAyNUw0Mi41IDI1eiIgLz4KICAgIDxnbHlwaCBnbHlwaC1uYW1lPSJwaXBldHRlIgogICAgICB1bmljb2RlPSImI3hGMTEyOyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE04MC40OTgwNDcgOTIuNUM3Ny40MzMxMSA5Mi41IDc0LjM2ODA0NCA5MS4zMjcwNDU2IDcyLjAxOTUzMSA4OC45Nzg1MTZMNTUuNjQwNjI1IDcyLjU5NzY1Nkw1NC44MTQ0NTMgNzMuNDIzODI4QzUyLjIzNzAzNiA3Ni4wMDEyNDggNDguMDg3MTgzIDc2LjAwMTI0OCA0NS41MDk3NjYgNzMuNDIzODI4QzQyLjkzMjM1MSA3MC44NDYzOTggNDIuOTMyMzUxIDY2LjY5NjU2MSA0NS41MDk3NjYgNjQuMTE5MTQxTDQ4Ljc1MTk1MyA2MC44NzVMMTUuMDE3NTc4IDI3LjE0MDYyNUMxMS42NTk4NzEgMjMuNzgyODI1IDExLjY1OTg3MSAxOC4zNzUyNzggMTUuMDE3NTc4IDE1LjAxNzU3OEMxOC4zNzUyODQgMTEuNjU5ODc4IDIzLjc4MjkxOCAxMS42NTk4NzggMjcuMTQwNjI1IDE1LjAxNzU3OEw2MC44NzUgNDguNzUxOTUzTDY0LjExNzE4OCA0NS41MDk3NjZDNjYuNjk0NjAzIDQyLjkzMjM2NiA3MC44NDY0MTQgNDIuOTMyMzY2IDczLjQyMzgyOCA0NS41MDk3NjZDNzYuMDAxMjQ0IDQ4LjA4NzE2NiA3Ni4wMDEyNDQgNTIuMjM2OTczIDczLjQyMzgyOCA1NC44MTQ0NTNMNzIuNTk3NjU2IDU1LjY0MDYyNUw4OC45NzY1NjIgNzIuMDE5NTMxQzkzLjY3MzU4NiA3Ni43MTY1ODEgOTMuNjczNTg2IDg0LjI4MTQ1NjAwMDAwMDEgODguOTc2NTYyIDg4Ljk3ODUxNkM4Ni42MjgwNSA5MS4zMjcwNDU2IDgzLjU2Mjk4MiA5Mi41IDgwLjQ5ODA0NyA5Mi41ek01Mi44ODg2NzIgNTcuMDM5MDYyTDU3LjAzOTA2MiA1Mi44ODg2NzJMNTIuNjIxMDk0IDQ4LjQ3MDcwM0M1Mi42MDUxNSA0OC40NTQwMTEgNTIuNTk0NTM2IDQ4LjQzNDM4IDUyLjU3ODEyNSA0OC40MTc5NjlMMjMuNzM4MjgxIDE5LjU4MDA3OEMyMi41ODYxMjkgMTguNDI3OTI2IDIwLjczMjIzIDE4LjQyNzkyNiAxOS41ODAwNzggMTkuNTgwMDc4QzE4LjQyNzkyNiAyMC43MzIyMyAxOC40Mjc5MjYgMjIuNTg2MTI5IDE5LjU4MDA3OCAyMy43MzgyODFMNDguNDE3OTY5IDUyLjU3ODEyNUM0OC40MzQzOCA1Mi41OTQ1MzYgNDguNDU0MDExIDUyLjYwNTE1IDQ4LjQ3MDcwMyA1Mi42MjEwOTRMNTIuODg4NjcyIDU3LjAzOTA2MnoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0icGl4ZWxpemUiCiAgICAgIHVuaWNvZGU9IiYjeEYxMTM7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTIxIDg0TDIxIDcxTDM0IDcxTDM0IDg0TDIxIDg0ek0zNiA4NEwzNiA3MUw0OSA3MUw0OSA4NEwzNiA4NHpNNTEgODRMNTEgNzFMNjQgNzFMNjQgNzRMNjQgNzZMNjQgODRMNTEgODR6TTY2IDc0TDY2IDYxTDc5IDYxTDc5IDc0TDY2IDc0ek0yMSA2OUwyMSA1NkwzNCA1NkwzNCA2OUwyMSA2OXpNNjYgNTlMNjYgNDZMNzkgNDZMNzkgNTlMNjYgNTl6TTIxIDU0TDIxIDQxTDM0IDQxTDM0IDQ5TDM0IDUxTDM0IDU0TDIxIDU0ek0zNiA0OUwzNiAzNkw0OSAzNkw0OSA0OUwzNiA0OXpNNTEgNDlMNTEgMzZMNjQgMzZMNjQgNDRMNjQgNDZMNjQgNDlMNTEgNDl6TTIxIDM5TDIxIDI2TDM0IDI2TDM0IDM5TDIxIDM5ek0yMSAyNEwyMSAxMUwzNCAxMUwzNCAyNEwyMSAyNHoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0icmVjdCIKICAgICAgdW5pY29kZT0iJiN4RjExNDsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNMTIuNSA4Mi41TDEyLjUgNzEuNjY2NjdMMTIuNSAxNy40OTk5N0wyMi41IDE3LjQ5OTk3TDg3LjUgMTcuNDk5OTdMODcuNSAyOC4zMzMzN0w4Ny41IDcxLjY2NjY3TDg3LjUgODIuNUw3Ny41IDgyLjVMMjIuNSA4Mi41TDEyLjUgODIuNXpNMjIuNSA3MS42NjY2N0w3Ny41IDcxLjY2NjY3TDc3LjUgMjguMzMzMzdMMjIuNSAyOC4zMzMzN0wyMi41IDcxLjY2NjY3eiIgLz4KICAgIDxnbHlwaCBnbHlwaC1uYW1lPSJyZWRvIgogICAgICB1bmljb2RlPSImI3hGMTE1OyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE01NS44OTUyNzIgOTBMODguODA3MTQ1IDYyLjI2MTcxOUw1NS44OTUyNzIgMzVMNjAuNTk2OTY4IDU1QzQ5LjQyMTI1NyA1NS44MjYxNzIgNDAuOTU4MjA0IDUzLjgyNjE3MiAzMi40OTUxNTEgNDcuODI2MTcyQzIxLjIxMTA4IDM5LjgyNjE3MiAxNS41NjkwNDUgMjMuODI2MTcyIDEzLjY4ODM2NiA5LjgyNjE3MkMxMS44MDc2ODggMjAuODI2MTcyIDQuMjg0OTc0NSA0NC44MjYxNzIgMTguMzkwMDYyIDU5LjgyNjE3MkMyNy4yMDU3NDMgNjkuMjAxMTcyIDM3Ljg1ODAyMyA3MS4xNTQyOTcgNDYuOTAzMjc4IDcxLjA1NjY0MUM1Mi4zMzA0MzEgNzAuOTk4MDUxIDU3LjA3MDY5NiA3MC4zNzUgNjAuNTk2OTY4IDcwTDU1Ljg5NTI3MiA5MHoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0icmVzaXplIgogICAgICB1bmljb2RlPSImI3hGMTE2OyIKICAgICAgaG9yaXotYWR2LXg9IjEwMCIgZD0iIE05NC41NzgxMTkgOTQuNTc0Mkw1NC45OTk5OTkgODVMNzQuOTk5OTk4IDgwTDc0Ljk5OTk5OCA4MEw0OS45OTk5OTkgNjVMNjQuOTk5OTk5IDQ5Ljk5OTk3TDc5Ljk5OTk5OCA3NUw3OS45OTk5OTggNzVMODQuOTk5OTk4IDU1eiBNNC41NzgxMTggNC41NzQxN0w0NC45OTk5OTkgMTQuOTk5OTdMMjQuOTk5OTk5IDE5Ljk5OTk3TDI0Ljk5OTk5OSAxOS45OTk5N0w0OS45OTk5OTkgMzQuOTk5OTdMMzQuOTk5OTk5IDQ5Ljk5OTk3TDIwIDI0Ljk5OTk3TDIwIDI0Ljk5OTk3TDE1IDQ0Ljk5OTk3eiIgLz4KICAgIDxnbHlwaCBnbHlwaC1uYW1lPSJyb3RhdGUiCiAgICAgIHVuaWNvZGU9IiYjeEYxMTc7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTQ5Ljc3OTI5NyA5Mi40OTk5Nzk5OTk5OTk5TDUxLjc2NTYyNSA3Ny40NTExNDk5OTk5OTk5TDQ3LjM4ODY3MiA3Ny41MDE5NDk5OTk5OTk5QzI4LjA1ODY5NCA3Ny41MDE5NDk5OTk5OTk5IDEzLjM4ODY1NSA2MS44MzAwNDk5OTk5OTk5IDEzLjM4ODY3MiA0Mi40OTk5Njk5OTk5OTk5QzEzLjM4ODY3MiAyMy4xNjk5Njk5OTk5OTk5IDI5LjA1ODcwNiA3LjQ5OTk2OTk5OTk5OTkgNDguMzg4NjcyIDcuNDk5OTY5OTk5OTk5OUM1NS40OTY4ODEgNy40OTk5Njk5OTk5OTk5IDYyLjEwOTcwMSA5LjYxOTA2OTk5OTk5OTkgNjcuNjMwODU5IDEzLjI1OTc2OTk5OTk5OTlDNjguNDI5MTc0IDEzLjc4NjE2OTk5OTk5OTkgNjkuMjAyMjgxIDE0LjM0NzI2OTk5OTk5OTkgNjkuOTUzMTI1IDE0LjkzNTU2OTk5OTk5OTlMNjIuODA2NjQxIDIyLjA4Mzk2OTk5OTk5OTlDNjIuNzA2ODMxIDIyLjAxMjk2OTk5OTk5OTkgNjIuNjEwNjQ2IDIxLjkzNjM2OTk5OTk5OTkgNjIuNTA5NzY2IDIxLjg2NzE2OTk5OTk5OTlDNTguNDkxODc5IDE5LjExMjE2OTk5OTk5OTkgNTMuNjI4Mzg5IDE3LjQ5OTk2OTk5OTk5OTkgNDguMzg4NjcyIDE3LjQ5OTk2OTk5OTk5OTlDMzQuNTgxNTUzIDE3LjQ5OTk2OTk5OTk5OTkgMjMuMzg4NjcyIDI4LjY5Mjg2OTk5OTk5OTkgMjMuMzg4NjcyIDQyLjQ5OTk2OTk5OTk5OTlDMjMuMzg4NjU1IDU2LjMwNzE5OTk5OTk5OTkgMzMuNTgxNTQyIDY3LjUwMTk0OTk5OTk5OTkgNDcuMzg4NjcyIDY3LjUwMTk0OTk5OTk5OTlMNDcuMzg4NjcyIDY3LjU0MTA0OTk5OTk5OTlMNTEuNzY1NjI1IDY3LjU1Mjc0OTk5OTk5OTlMNDkuNzc1MzkxIDUyLjUwMDAxOTk5OTk5OTlMODUgNzIuNTAxOTVMNDkuNzc5Mjk3IDkyLjV6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9InNhdmUiCiAgICAgIHVuaWNvZGU9IiYjeEYxMTg7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTEwIDg2TDEwIDkuOTk5OTdMOTAgOS45OTk5N0w5MCA3MEw3NCA4Nkw2MiA4Nkw2MiA1NkwyNCA1NkwyNCA4NkwxMCA4NnogTTQ0IDgzLjU1NDY4OTk5OTk5OTlMNDQgNjEuOTk5OTk5OTk5OTk5OUw1NCA2MS45OTk5OTk5OTk5OTk5TDU0LjA1NDY5IDgzLjU1NDY4OTk5OTk5OTlMNDQuMDAwMDAyIDgzLjU1NDY4OTk5OTk5OTl6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9InNlbGVjdCIKICAgICAgdW5pY29kZT0iJiN4RjExOTsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNMTMgNzguOTk5OTlIMjNWNjguOTk5OTlIMTNWNzguOTk5OTl6IE03NyA3OC45OTk5OUg4N1Y2OC45OTk5OUg3N1Y3OC45OTk5OXogTTEzIDYyLjk5OTk5SDIzVjUyLjk5OTk5SDEzVjYyLjk5OTk5eiBNMTMgNDYuOTk5OTdIMjNWMzYuOTk5OTdIMTNWNDYuOTk5OTd6IE0yOSA3OC45OTk5OUgzOVY2OC45OTk5OUgyOVY3OC45OTk5OXogTTQ1IDc4Ljk5OTk5SDU1VjY4Ljk5OTk5SDQ1Vjc4Ljk5OTk5eiBNNjEgNzguOTk5OTlINzFWNjguOTk5OTlINjFWNzguOTk5OTl6IE0xMyAzMC45OTk5N0gyM1YyMC45OTk5N0gxM1YzMC45OTk5N3ogTTc3IDYyLjk5OTk5SDg3VjUyLjk5OTk5SDc3VjYyLjk5OTk5eiBNNzcgNDYuOTk5OTdIODdWMzYuOTk5OTdINzdWNDYuOTk5OTd6IE03NyAzMC45OTk5N0g4N1YyMC45OTk5N0g3N1YzMC45OTk5N3ogTTI5IDMwLjk5OTk3SDM5VjIwLjk5OTk3SDI5VjMwLjk5OTk3eiBNNDUgMzAuOTk5OTdINTVWMjAuOTk5OTdINDVWMzAuOTk5OTd6IE02MSAzMC45OTk5N0g3MVYyMC45OTk5N0g2MVYzMC45OTk5N3oiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0ic2V0dGluZ3MiCiAgICAgIHVuaWNvZGU9IiYjeEYxMUE7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTQyLjUgOTIuNUw0Mi41IDgxLjU4NTkzODAwMDAwMDFBMzIuNDk5OTk5IDMyLjQ5OTk2MSAwIDAgMSAzMi45MzM1OTQgNzcuNjEzMjgxTDI1LjIzNDM3NSA4NS4zMTI1TDE0LjY2MjEwOSA3NC43NDIxODgwMDAwMDAxTDIyLjM1NzQyMiA2Ny4wNDY4NzVBMzIuNDk5OTk5IDMyLjQ5OTk2MSAwIDAgMSAxOC40MDQyOTcgNTcuNDUxMTcyTDcuNSA1Ny40NTExNzJMNy41IDQyLjVMMTguNDE0MDYyIDQyLjVBMzIuNDk5OTk5IDMyLjQ5OTk2MSAwIDAgMSAyMi4zODY3MTkgMzIuOTMzNTk0TDE0LjY2MjEwOSAyNS4yMDg5ODRMMjUuMjM0Mzc1IDE0LjYzNjcxOUwzMi45NTMxMjUgMjIuMzU3NDIyQTMyLjQ5OTk5OSAzMi40OTk5NjEgMCAwIDEgNDIuNSAxOC40MTYwMTZMNDIuNSA3LjU0ODgyOEw1Ny41IDcuNTQ4ODI4TDU3LjUgMTguNDE0MDYxOTk5OTk5OUEzMi40OTk5OTkgMzIuNDk5OTYxIDAgMCAxIDY3LjAzNTE1NiAyMi4zNjkxNDFMNzQuNzY1NjI1IDE0LjYzNjcxOUw4NS4zMzc4OTEgMjUuMjA4OTg0TDc3LjYyNSAzMi45MjE4NzVBMzIuNDk5OTk5IDMyLjQ5OTk2MSAwIDAgMSA4MS41ODM5ODQgNDIuNUw5Mi41IDQyLjVMOTIuNSA1Ny40NTExNzJMODEuNTgwMDc4IDU3LjQ1MTE3MkEzMi40OTk5OTkgMzIuNDk5OTYxIDAgMCAxIDc3LjYzMDg1OSA2Ny4wMzUxNTZMODUuMzM3ODkxIDc0Ljc0MjE4ODAwMDAwMDFMNzQuNzY1NjI1IDg1LjMxMjVMNjcuMDc4MTI1IDc3LjYyNUEzMi40OTk5OTkgMzIuNDk5OTYxIDAgMCAxIDU3LjUgODEuNTgzOTg0TDU3LjUgOTIuNUw0Mi41IDkyLjV6TTUwIDY3LjIwNTA3OEExNy4yMDU4ODEgMTcuMjA1ODQ1IDAgMCAwIDY3LjIwNTA3OCA1MEExNy4yMDU4ODEgMTcuMjA1ODQ1IDAgMCAwIDUwIDMyLjc5NDkyMkExNy4yMDU4ODEgMTcuMjA1ODQ1IDAgMCAwIDMyLjc5NDkyMiA1MEExNy4yMDU4ODEgMTcuMjA1ODQ1IDAgMCAwIDUwIDY3LjIwNTA3OHoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0idGV4dCIKICAgICAgdW5pY29kZT0iJiN4RjExQjsiCiAgICAgIGhvcml6LWFkdi14PSIxMDAiIGQ9IiBNMTUgODVMMTUgNzVMNDUgNzVMNDUgMTBMNTUgMTBMNTUgNzVMODUgNzVMODUgODVMMTUgODV6IiAvPgogICAgPGdseXBoIGdseXBoLW5hbWU9InVuZG8iCiAgICAgIHVuaWNvZGU9IiYjeEYxMUM7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTQyLjkxMTg3MyA5MEwxMCA2Mi4yNjE3MTlMNDIuOTExODczIDM1TDM4LjIxMDE3NyA1NUM0OS4zODU4ODggNTUuODI2MTcyIDU3Ljg0ODk0MSA1My44MjYxNzIgNjYuMzExOTk0IDQ3LjgyNjE3MkM3Ny41OTYwNjUgMzkuODI2MTcyIDgzLjIzODEgMjMuODI2MTcyIDg1LjExODc3OSA5LjgyNjE3MkM4Ni45OTk0NTcgMjAuODI2MTcyIDk0LjUyMjE3MSA0NC44MjYxNzIgODAuNDE3MDgzIDU5LjgyNjE3MkM3MS42MDE0MDIgNjkuMjAxMTcyIDYwLjk0OTEyMiA3MS4xNTQyOTcgNTEuOTAzODY3IDcxLjA1NjY0MUM0Ni40NzY3MTQgNzAuOTk4MDUxIDQxLjczNjQ0OSA3MC4zNzUgMzguMjEwMTc3IDcwTDQyLjkxMTg3MyA5MHoiIC8+CiAgICA8Z2x5cGggZ2x5cGgtbmFtZT0idW5saW5rZWQiCiAgICAgIHVuaWNvZGU9IiYjeEYxMUQ7IgogICAgICBob3Jpei1hZHYteD0iMTAwIiBkPSIgTTQxLjk3NjU2MiA5NS4zMDY2NDA2TDI5Ljk1MTE3MiA4NC42OTMzNTlMMjkuOTUxMTcyIDY4Ljc3MzQzODAwMDAwMDFMNDEgNTdMNDIgNTdMNDIgNjJMNDIgNjRMMzUuOTYyODkxIDcwLjU0Mjk2OUwzNS45NjI4OTEgODIuOTIzODI4TDQzLjk4MDQ2OSA5MEw1NCA5MEw2Mi4wMTU2MjUgODIuOTIzODI4TDYyLjAxNTYyNSA3MC41NDI5NjlMNTYgNjRMNTYgNTdMNTcgNTdMNjguMDI5Mjk3IDY4Ljc3MzQzODAwMDAwMDFMNjguMDI5Mjk3IDg0LjY5MzM1OUw1Ni4wMDM5MDYgOTUuMzA2NjQwNkw0MS45NzY1NjIgOTUuMzA2NjQwNnpNMTQgNjhMMTIuMTE3MTg4IDY0LjQ3MDcwM0wyOCA1NkwyOS44ODI4MTIgNTkuNTI5Mjk3TDE0IDY4ek04NiA2OEw3MC4xMTcxODggNTkuNTI5Mjk3TDcyIDU2TDg3Ljg4MjgxMiA2NC40NzA3MDNMODYgNjh6TTEwIDUyTDEwIDQ4TDI4IDQ4TDI4IDUyTDEwIDUyek03MiA1Mkw3MiA0OEw5MCA0OEw5MCA1Mkw3MiA1MnpNMjggNDRMMTIuMTE3MTg4IDM1LjUyOTI5N0wxNCAzMkwyOS44ODI4MTIgNDAuNDcwNzAzTDI4IDQ0ek03MiA0NEw3MC4xMTcxODggNDAuNDcwNzAzTDg2IDMyTDg3Ljg4MjgxMiAzNS41MjkyOTdMNzIgNDR6TTQxIDQzTDI5Ljk1MTE3MiAzMS4yMjY1NjE5OTk5OTk5TDI5Ljk1MTE3MiAxNS4zMDY2NDFMNDEuOTc2NTYyIDQuNjkzMzU5TDU2LjAwMzkwNiA0LjY5MzM1OUw2OC4wMjkyOTcgMTUuMzA2NjQxTDY4LjAyOTI5NyAzMS4yMjY1NjE5OTk5OTk5TDU3IDQzTDU2IDQzTDU2IDM2TDYyLjAxNTYyNSAyOS40NTcwMzFMNjIuMDE1NjI1IDE3LjA3NjE3Mkw1NCAxMEw0My45ODA0NjkgMTBMMzUuOTYyODkxIDE3LjA3NjE3MkwzNS45NjI4OTEgMjkuNDU3MDMxTDQyIDM2TDQyIDM4TDQyIDQzTDQxIDQzeiIgLz4KICA8L2ZvbnQ+CjwvZGVmcz4KPC9zdmc+Cg=="
}, function(t, e) {
    t.exports = "data:application/x-font-ttf;base64,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AOwAAwABBAkACgBWAQQAAwABBAkACwAmAVpwdHJvaWNvbmZvbnRSZWd1bGFycHRyb2ljb25mb250cHRyb2ljb25mb250VmVyc2lvbiAxLjBwdHJvaWNvbmZvbnRHZW5lcmF0ZWQgYnkgc3ZnMnR0ZiBmcm9tIEZvbnRlbGxvIHByb2plY3QuaHR0cDovL2ZvbnRlbGxvLmNvbQBwAHQAcgBvAGkAYwBvAG4AZgBvAG4AdABSAGUAZwB1AGwAYQByAHAAdAByAG8AaQBjAG8AbgBmAG8AbgB0AHAAdAByAG8AaQBjAG8AbgBmAG8AbgB0AFYAZQByAHMAaQBvAG4AIAAxAC4AMABwAHQAcgBvAGkAYwBvAG4AZgBvAG4AdABHAGUAbgBlAHIAYQB0AGUAZAAgAGIAeQAgAHMAdgBnADIAdAB0AGYAIABmAHIAbwBtACAARgBvAG4AdABlAGwAbABvACAAcAByAG8AagBlAGMAdAAuAGgAdAB0AHAAOgAvAC8AZgBvAG4AdABlAGwAbABvAC4AYwBvAG0AAAACAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4BAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwEYARkBGgEbARwBHQEeAR8ACjBwYWludGVycm8FYXBwbHkEYmx1cgVicnVzaAVjbG9zZQRjcm9wB2VsbGlwc2UGZXJhc2VyBGxpbmUGbGlua2VkB2xvYWRpbmcGbWlycm9yBG9wZW4RcGFzdGVfZXh0ZW5kX2Rvd24ScGFzdGVfZXh0ZW5kX3JpZ2h0CXBhc3RlX2ZpdApwYXN0ZV9vdmVyB3BpcGV0dGUIcGl4ZWxpemUEcmVjdARyZWRvBnJlc2l6ZQZyb3RhdGUEc2F2ZQZzZWxlY3QIc2V0dGluZ3MEdGV4dAR1bmRvCHVubGlua2VkAAAAAA=="
}, function(t, e) {
    t.exports = "data:application/font-woff;base64,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"
}]);