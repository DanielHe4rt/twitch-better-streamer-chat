Changes.ChangesHighlighter=function(config,parserConfig){const diffRows=parserConfig.diffRows;const baselineLines=parserConfig.baselineLines;const currentLines=parserConfig.currentLines;const syntaxHighlightMode=CodeMirror.getMode({},parserConfig.mimeType);function fastForward(state,baselineLineNumber,currentLineNumber){if(baselineLineNumber>state.baselineLineNumber){fastForwardSyntaxHighlighter(state.baselineSyntaxState,state.baselineLineNumber,baselineLineNumber,baselineLines);state.baselineLineNumber=baselineLineNumber;}
if(currentLineNumber>state.currentLineNumber){fastForwardSyntaxHighlighter(state.currentSyntaxState,state.currentLineNumber,currentLineNumber,currentLines);state.currentLineNumber=currentLineNumber;}}
function fastForwardSyntaxHighlighter(syntaxState,from,to,lines){let lineNumber=from;while(lineNumber<to&&lineNumber<lines.length){const stream=new CodeMirror.StringStream(lines[lineNumber]);if(stream.eol()&&syntaxHighlightMode.blankLine)
syntaxHighlightMode.blankLine(syntaxState);while(!stream.eol()){syntaxHighlightMode.token(stream,syntaxState);stream.start=stream.pos;}
lineNumber++;}}
return{startState:function(){return{rowNumber:0,diffTokenIndex:0,currentLineNumber:0,baselineLineNumber:0,currentSyntaxState:CodeMirror.startState(syntaxHighlightMode),baselineSyntaxState:CodeMirror.startState(syntaxHighlightMode),syntaxPosition:0,diffPosition:0,syntaxStyle:'',diffStyle:''};},token:function(stream,state){const diffRow=diffRows[state.rowNumber];if(!diffRow){stream.next();return'';}
fastForward(state,diffRow.baselineLineNumber-1,diffRow.currentLineNumber-1);let classes='';if(stream.pos===0)
classes+=' line-background-'+diffRow.type+' line-'+diffRow.type;const syntaxHighlighterNeedsRefresh=state.diffPosition>=state.syntaxPosition;if(state.diffPosition<=state.syntaxPosition){state.diffPosition+=diffRow.tokens[state.diffTokenIndex].text.length;state.diffStyle=diffRow.tokens[state.diffTokenIndex].className;state.diffTokenIndex++;}
if(syntaxHighlighterNeedsRefresh){if(diffRow.type===Changes.ChangesView.RowType.Deletion||diffRow.type===Changes.ChangesView.RowType.Addition||diffRow.type===Changes.ChangesView.RowType.Equal){state.syntaxStyle=syntaxHighlightMode.token(stream,diffRow.type===Changes.ChangesView.RowType.Deletion?state.baselineSyntaxState:state.currentSyntaxState);state.syntaxPosition=stream.pos;}else{state.syntaxStyle='';state.syntaxPosition=Infinity;}}
stream.pos=Math.min(state.syntaxPosition,state.diffPosition);classes+=' '+state.syntaxStyle;classes+=' '+state.diffStyle;if(stream.eol()){state.rowNumber++;if(diffRow.type===Changes.ChangesView.RowType.Deletion)
state.baselineLineNumber++;else
state.currentLineNumber++;state.diffPosition=0;state.syntaxPosition=0;state.diffTokenIndex=0;}
return classes;},blankLine:function(state){const diffRow=diffRows[state.rowNumber];state.rowNumber++;state.syntaxPosition=0;state.diffPosition=0;state.diffTokenIndex=0;if(!diffRow)
return'';let style='';if(syntaxHighlightMode.blankLine){if(diffRow.type===Changes.ChangesView.RowType.Equal||diffRow.type===Changes.ChangesView.RowType.Addition){style=syntaxHighlightMode.blankLine(state.currentSyntaxState);state.currentLineNumber++;}else if(diffRow.type===Changes.ChangesView.RowType.Deletion){style=syntaxHighlightMode.blankLine(state.baselineSyntaxState);state.baselineLineNumber++;}}
return style+' line-background-'+diffRow.type+' line-'+diffRow.type;},copyState:function(state){const newState=Object.assign({},state);newState.currentSyntaxState=CodeMirror.copyState(syntaxHighlightMode,state.currentSyntaxState);newState.baselineSyntaxState=CodeMirror.copyState(syntaxHighlightMode,state.baselineSyntaxState);return(newState);}};};Changes.ChangesHighlighter.DiffState;CodeMirror.defineMode('devtools-diff',Changes.ChangesHighlighter);;Changes.ChangesView=class extends UI.VBox{constructor(){super(true);this.registerRequiredCSS('changes/changesView.css');const splitWidget=new UI.SplitWidget(true,false);const mainWidget=new UI.Widget();splitWidget.setMainWidget(mainWidget);splitWidget.show(this.contentElement);this._emptyWidget=new UI.EmptyWidget('');this._emptyWidget.show(mainWidget.element);this._workspaceDiff=WorkspaceDiff.workspaceDiff();this._changesSidebar=new Changes.ChangesSidebar(this._workspaceDiff);this._changesSidebar.addEventListener(Changes.ChangesSidebar.Events.SelectedUISourceCodeChanged,this._selectedUISourceCodeChanged,this);splitWidget.setSidebarWidget(this._changesSidebar);this._selectedUISourceCode=null;this._diffRows=[];this._maxLineDigits=1;this._editor=new TextEditor.CodeMirrorTextEditor({lineNumbers:true,lineWrapping:false,maxHighlightLength:Infinity});this._editor.setReadOnly(true);this._editor.show(mainWidget.element.createChild('div','editor-container'));this._editor.hideWidget();this._editor.element.addEventListener('click',this._click.bind(this),false);this._toolbar=new UI.Toolbar('changes-toolbar',mainWidget.element);const revertButton=new UI.ToolbarButton(Common.UIString('Revert all changes'),'largeicon-undo');revertButton.addEventListener(UI.ToolbarButton.Events.Click,this._revert.bind(this));this._toolbar.appendToolbarItem(revertButton);this._diffStats=new UI.ToolbarText('');this._toolbar.appendToolbarItem(this._diffStats);this._toolbar.setEnabled(false);this._hideDiff(ls`No changes`);this._selectedUISourceCodeChanged();}
_selectedUISourceCodeChanged(){this._revealUISourceCode(this._changesSidebar.selectedUISourceCode());}
_revert(){const uiSourceCode=this._selectedUISourceCode;if(!uiSourceCode)
return;this._workspaceDiff.revertToOriginal(uiSourceCode);}
_click(event){const selection=this._editor.selection();if(!selection.isEmpty())
return;const row=this._diffRows[selection.startLine];Common.Revealer.reveal(this._selectedUISourceCode.uiLocation(row.currentLineNumber-1,selection.startColumn),false);event.consume(true);}
_revealUISourceCode(uiSourceCode){if(this._selectedUISourceCode===uiSourceCode)
return;if(this._selectedUISourceCode)
this._workspaceDiff.unsubscribeFromDiffChange(this._selectedUISourceCode,this._refreshDiff,this);if(uiSourceCode&&this.isShowing())
this._workspaceDiff.subscribeToDiffChange(uiSourceCode,this._refreshDiff,this);this._selectedUISourceCode=uiSourceCode;this._refreshDiff();}
wasShown(){this._refreshDiff();}
_refreshDiff(){if(!this.isShowing())
return;if(!this._selectedUISourceCode){this._renderDiffRows(null);return;}
const uiSourceCode=this._selectedUISourceCode;if(!uiSourceCode.contentType().isTextType()){this._hideDiff(ls`Binary data`);return;}
this._workspaceDiff.requestDiff(uiSourceCode).then(diff=>{if(this._selectedUISourceCode!==uiSourceCode)
return;this._renderDiffRows(diff);});}
_hideDiff(message){this._diffStats.setText('');this._toolbar.setEnabled(false);this._editor.hideWidget();this._emptyWidget.text=message;this._emptyWidget.showWidget();}
_renderDiffRows(diff){this._diffRows=[];if(!diff||(diff.length===1&&diff[0][0]===Diff.Diff.Operation.Equal)){this._hideDiff(ls`No changes`);return;}
let insertions=0;let deletions=0;let currentLineNumber=0;let baselineLineNumber=0;const paddingLines=3;const originalLines=[];const currentLines=[];for(let i=0;i<diff.length;++i){const token=diff[i];switch(token[0]){case Diff.Diff.Operation.Equal:this._diffRows.pushAll(createEqualRows(token[1],i===0,i===diff.length-1));originalLines.pushAll(token[1]);currentLines.pushAll(token[1]);break;case Diff.Diff.Operation.Insert:for(const line of token[1])
this._diffRows.push(createRow(line,Changes.ChangesView.RowType.Addition));insertions+=token[1].length;currentLines.pushAll(token[1]);break;case Diff.Diff.Operation.Delete:deletions+=token[1].length;originalLines.pushAll(token[1]);if(diff[i+1]&&diff[i+1][0]===Diff.Diff.Operation.Insert){i++;this._diffRows.pushAll(createModifyRows(token[1].join('\n'),diff[i][1].join('\n')));insertions+=diff[i][1].length;currentLines.pushAll(diff[i][1]);}else{for(const line of token[1])
this._diffRows.push(createRow(line,Changes.ChangesView.RowType.Deletion));}
break;}}
this._maxLineDigits=Math.ceil(Math.log10(Math.max(currentLineNumber,baselineLineNumber)));this._diffStats.setText(Common.UIString('%d insertion%s (+), %d deletion%s (-)',insertions,insertions!==1?'s':'',deletions,deletions!==1?'s':''));this._toolbar.setEnabled(true);this._emptyWidget.hideWidget();this._editor.operation(()=>{this._editor.showWidget();this._editor.setHighlightMode({name:'devtools-diff',diffRows:this._diffRows,mimeType:(this._selectedUISourceCode).mimeType(),baselineLines:originalLines,currentLines:currentLines});this._editor.setText(this._diffRows.map(row=>row.tokens.map(t=>t.text).join('')).join('\n'));this._editor.setLineNumberFormatter(this._lineFormatter.bind(this));});function createEqualRows(lines,atStart,atEnd){const equalRows=[];if(!atStart){for(let i=0;i<paddingLines&&i<lines.length;i++)
equalRows.push(createRow(lines[i],Changes.ChangesView.RowType.Equal));if(lines.length>paddingLines*2+1&&!atEnd){equalRows.push(createRow(Common.UIString('( \u2026 Skipping ')+(lines.length-paddingLines*2)+
Common.UIString(' matching lines \u2026 )'),Changes.ChangesView.RowType.Spacer));}}
if(!atEnd){const start=Math.max(lines.length-paddingLines-1,atStart?0:paddingLines);let skip=lines.length-paddingLines-1;if(!atStart)
skip-=paddingLines;if(skip>0){baselineLineNumber+=skip;currentLineNumber+=skip;}
for(let i=start;i<lines.length;i++)
equalRows.push(createRow(lines[i],Changes.ChangesView.RowType.Equal));}
return equalRows;}
function createModifyRows(before,after){const internalDiff=Diff.Diff.charDiff(before,after,true);const deletionRows=[createRow('',Changes.ChangesView.RowType.Deletion)];const insertionRows=[createRow('',Changes.ChangesView.RowType.Addition)];for(const token of internalDiff){const text=token[1];const type=token[0];const className=type===Diff.Diff.Operation.Equal?'':'inner-diff';const lines=text.split('\n');for(let i=0;i<lines.length;i++){if(i>0&&type!==Diff.Diff.Operation.Insert)
deletionRows.push(createRow('',Changes.ChangesView.RowType.Deletion));if(i>0&&type!==Diff.Diff.Operation.Delete)
insertionRows.push(createRow('',Changes.ChangesView.RowType.Addition));if(!lines[i])
continue;if(type!==Diff.Diff.Operation.Insert)
deletionRows[deletionRows.length-1].tokens.push({text:lines[i],className});if(type!==Diff.Diff.Operation.Delete)
insertionRows[insertionRows.length-1].tokens.push({text:lines[i],className});}}
return deletionRows.concat(insertionRows);}
function createRow(text,type){if(type===Changes.ChangesView.RowType.Addition)
currentLineNumber++;if(type===Changes.ChangesView.RowType.Deletion)
baselineLineNumber++;if(type===Changes.ChangesView.RowType.Equal){baselineLineNumber++;currentLineNumber++;}
return{baselineLineNumber,currentLineNumber,tokens:text?[{text,className:'inner-diff'}]:[],type};}}
_lineFormatter(lineNumber){const row=this._diffRows[lineNumber-1];let showBaseNumber=row.type===Changes.ChangesView.RowType.Deletion;let showCurrentNumber=row.type===Changes.ChangesView.RowType.Addition;if(row.type===Changes.ChangesView.RowType.Equal){showBaseNumber=true;showCurrentNumber=true;}
const base=showBaseNumber?numberToStringWithSpacesPadding(row.baselineLineNumber,this._maxLineDigits):spacesPadding(this._maxLineDigits);const current=showCurrentNumber?numberToStringWithSpacesPadding(row.currentLineNumber,this._maxLineDigits):spacesPadding(this._maxLineDigits);return base+spacesPadding(1)+current;}};Changes.ChangesView.Row;Changes.ChangesView.RowType={Deletion:'deletion',Addition:'addition',Equal:'equal',Spacer:'spacer'};Changes.ChangesView.DiffUILocationRevealer=class{async reveal(diffUILocation,omitFocus){if(!(diffUILocation instanceof WorkspaceDiff.DiffUILocation))
throw new Error('Internal error: not a diff ui location');const changesView=self.runtime.sharedInstance(Changes.ChangesView);await UI.viewManager.showView('changes.changes');changesView._changesSidebar.selectUISourceCode(diffUILocation.uiSourceCode,omitFocus);}};;Changes.ChangesSidebar=class extends UI.Widget{constructor(workspaceDiff){super();this._treeoutline=new UI.TreeOutlineInShadow();this._treeoutline.registerRequiredCSS('changes/changesSidebar.css');this._treeoutline.setComparator((a,b)=>a.titleAsText().compareTo(b.titleAsText()));this._treeoutline.addEventListener(UI.TreeOutline.Events.ElementSelected,this._selectionChanged,this);this.element.appendChild(this._treeoutline.element);this._treeElements=new Map();this._workspaceDiff=workspaceDiff;this._workspaceDiff.modifiedUISourceCodes().forEach(this._addUISourceCode.bind(this));this._workspaceDiff.addEventListener(WorkspaceDiff.Events.ModifiedStatusChanged,this._uiSourceCodeMofiedStatusChanged,this);}
selectUISourceCode(uiSourceCode,omitFocus){const treeElement=this._treeElements.get(uiSourceCode);if(!treeElement)
return;treeElement.select(omitFocus);}
selectedUISourceCode(){return this._treeoutline.selectedTreeElement?this._treeoutline.selectedTreeElement.uiSourceCode:null;}
_selectionChanged(){this.dispatchEventToListeners(Changes.ChangesSidebar.Events.SelectedUISourceCodeChanged);}
_uiSourceCodeMofiedStatusChanged(event){if(event.data.isModified)
this._addUISourceCode(event.data.uiSourceCode);else
this._removeUISourceCode(event.data.uiSourceCode);}
_removeUISourceCode(uiSourceCode){const treeElement=this._treeElements.get(uiSourceCode);this._treeElements.delete(uiSourceCode);if(this._treeoutline.selectedTreeElement===treeElement){const nextElementToSelect=treeElement.previousSibling||treeElement.nextSibling;if(nextElementToSelect){nextElementToSelect.select(true);}else{treeElement.deselect();this._selectionChanged();}}
this._treeoutline.removeChild(treeElement);treeElement.dispose();}
_addUISourceCode(uiSourceCode){const treeElement=new Changes.ChangesSidebar.UISourceCodeTreeElement(uiSourceCode);this._treeElements.set(uiSourceCode,treeElement);this._treeoutline.appendChild(treeElement);if(!this._treeoutline.selectedTreeElement)
treeElement.select(true);}};Changes.ChangesSidebar.Events={SelectedUISourceCodeChanged:Symbol('SelectedUISourceCodeChanged')};Changes.ChangesSidebar.UISourceCodeTreeElement=class extends UI.TreeElement{constructor(uiSourceCode){super();this.uiSourceCode=uiSourceCode;this.listItemElement.classList.add('navigator-'+uiSourceCode.contentType().name()+'-tree-item');let iconType='largeicon-navigator-file';if(Snippets.isSnippetsUISourceCode(this.uiSourceCode))
iconType='largeicon-navigator-snippet';const defaultIcon=UI.Icon.create(iconType,'icon');this.setLeadingIcons([defaultIcon]);this._eventListeners=[uiSourceCode.addEventListener(Workspace.UISourceCode.Events.TitleChanged,this._updateTitle,this),uiSourceCode.addEventListener(Workspace.UISourceCode.Events.WorkingCopyChanged,this._updateTitle,this),uiSourceCode.addEventListener(Workspace.UISourceCode.Events.WorkingCopyCommitted,this._updateTitle,this)];this._updateTitle();}
_updateTitle(){let titleText=this.uiSourceCode.displayName();if(this.uiSourceCode.isDirty())
titleText='*'+titleText;this.title=titleText;let tooltip=this.uiSourceCode.url();if(this.uiSourceCode.contentType().isFromSourceMap())
tooltip=Common.UIString('%s (from source map)',this.uiSourceCode.displayName());this.tooltip=tooltip;}
dispose(){Common.EventTarget.removeEventListeners(this._eventListeners);}};;Runtime.cachedResources["changes/changesView.css"]="/*\n * Copyright (c) 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n[slot=insertion-point-main]{\n    flex-direction: column;\n    display: flex;\n}\n\n[slot=insertion-point-sidebar] {\n    overflow: auto;\n}\n\n.editor-container{\n    flex: 1;\n}\n\n:focus.selected {\n    background-color: var(--selection-bg-color);\n    color: #FFF;\n}\n\n.CodeMirror-lines:not(:active) {\n    cursor: default !important;\n}\n\n.CodeMirror-line:hover {\n    cursor: default !important;\n    background-color: rgba(0,0,255,0.05);\n}\n\n.CodeMirror .CodeMirror-linebackground.spacer {\n    text-align: center;\n    color: rgba(0, 0, 0, 0.5);\n    background-color: rgba(0, 0, 255, 0.1);\n}\n\n.CodeMirror .equal > span > span {\n    opacity: .5;\n}\n\n.CodeMirror .CodeMirror-selectedtext:not(.CodeMirror-persist-highlight) {\n    opacity: 1.0;\n}\n\n.CodeMirror .CodeMirror-linebackground.addition, -theme-preserve {\n    background-color: hsla(144, 55%, 49%, .2);\n}\n\n.CodeMirror .CodeMirror-linebackground.deletion, -theme-preserve {\n    background-color: rgba(255, 0, 0, .2);\n}\n\n.CodeMirror .addition .cm-inner-diff:not(.CodeMirror-selectedtext), -theme-preserve {\n    background-color: hsla(144, 55%, 49%, .3);\n}\n\n.CodeMirror .deletion .cm-inner-diff:not(.CodeMirror-selectedtext), -theme-preserve {\n    background-color: rgba(255, 0, 0, .3);\n}\n\n.changes-toolbar {\n    background-color: var(--toolbar-bg-color);\n    border-top: var(--divider-border);\n}\n\n/*# sourceURL=changes/changesView.css */";Runtime.cachedResources["changes/changesSidebar.css"]="li .icon {\n  margin: -3px -5px -3px -5px;\n  background: linear-gradient(45deg, hsl(0, 0%, 50%), hsl(0, 0%, 70%));\n}\n\n.tree-outline li {\n  min-height: 20px;\n}\n\n.tree-outline li:hover:not(.selected) .selection {\n  display: block;\n  background-color: rgba(56, 121, 217, 0.1);\n}\n\n.navigator-fs-tree-item .icon{\n  background: linear-gradient(45deg, hsl(28, 75%, 50%), hsl(28, 75%, 70%));\n}\n\n.navigator-sm-script-tree-item .icon,\n.navigator-script-tree-item .icon,\n.navigator-snippet-tree-item .icon {\n  background: linear-gradient(45deg, hsl(48, 70%, 50%), hsl(48, 70%, 70%));\n}\n\n.navigator-sm-stylesheet-tree-item .icon,\n.navigator-stylesheet-tree-item .icon {\n  background: linear-gradient(45deg, hsl(256, 50%, 50%), hsl(256, 50%, 70%));\n}\n\n.navigator-image-tree-item .icon,\n.navigator-font-tree-item .icon {\n  background: linear-gradient(45deg, hsl(109, 33%, 50%), hsl(109, 33%, 70%));\n}\n/*# sourceURL=changes/changesSidebar.css */";