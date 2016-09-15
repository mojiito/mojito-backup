export abstract class VisitElement {
    abstract visitElement(element: Element, context: any): any;
}

export abstract class VisitAttribute {
    abstract visitAttribute(attribute: Attr, context: any): void;
}

export abstract class VisitText {
    abstract visitText(text: Text, context: any): void;
}

export abstract class VisitComment {
    abstract visitComment(comment: Comment, context: any): void;
}

export abstract class Visitor implements VisitElement, VisitAttribute, VisitComment, VisitText {
    visitElement(element: Element, context: any): any {}
    visitAttribute(attribute: Attr, context: any): any {}
    visitText(text: Text, context: any): any {}
    visitComment(comment: Comment, context: any): any {}
}